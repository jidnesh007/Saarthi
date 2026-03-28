"""
Crowd Density Classification — Flask Backend
Run:  python app.py
Then open:  http://localhost:5000
"""

import os, time, cv2, json, base64, threading
import numpy as np
from pathlib import Path
from collections import deque
from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from werkzeug.utils import secure_filename
from ultralytics import YOLO

# ──────────────────────────────────────────────────────────────
#  CONFIG
# ──────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent
UPLOAD_DIR   = BASE_DIR / "uploads"
OUTPUT_DIR   = BASE_DIR / "outputs"
STATIC_DIR   = BASE_DIR / "static"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE = {"jpg", "jpeg", "png", "bmp", "webp"}
ALLOWED_VIDEO = {"mp4", "avi", "mov", "mkv", "webm"}

# Model path — edit this to point to your best.pt if available
MODEL_PATH = os.environ.get("MODEL_PATH", "yolov8s.pt")

app = Flask(__name__, template_folder=str(BASE_DIR), static_folder=str(STATIC_DIR))
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024   # 200 MB

# ──────────────────────────────────────────────────────────────
#  MODEL (loaded once at startup)
# ──────────────────────────────────────────────────────────────
print(f"Loading model: {MODEL_PATH} …")
model = YOLO(MODEL_PATH)
print("✅ Model loaded.")

# ──────────────────────────────────────────────────────────────
#  CORE DETECTION UTILITIES
# ──────────────────────────────────────────────────────────────

def nms_boxes(boxes, confs, iou_thresh=0.45):
    if not boxes:
        return [], []
    boxes  = np.array(boxes, dtype=np.float32)
    confs  = np.array(confs, dtype=np.float32)
    order  = confs.argsort()[::-1]
    keep   = []
    x1,y1,x2,y2 = boxes[:,0],boxes[:,1],boxes[:,2],boxes[:,3]
    areas = (x2-x1)*(y2-y1)
    while order.size:
        i = order[0]; keep.append(i)
        if order.size == 1: break
        rest = order[1:]
        ix1 = np.maximum(x1[i],x1[rest]); iy1 = np.maximum(y1[i],y1[rest])
        ix2 = np.minimum(x2[i],x2[rest]); iy2 = np.minimum(y2[i],y2[rest])
        inter = np.maximum(0,ix2-ix1)*np.maximum(0,iy2-iy1)
        iou   = inter/(areas[i]+areas[rest]-inter+1e-6)
        order = rest[iou < iou_thresh]
    return boxes[keep].astype(int).tolist(), confs[keep].tolist()


def tiled_detect(frame, conf=0.18, tile_grid=(3,3), overlap=0.25):
    H, W = frame.shape[:2]
    all_b, all_c = [], []

    # Full-image pass at high resolution
    res = model(frame, conf=conf, classes=[0], imgsz=1280, verbose=False)[0]
    for d in res.boxes:
        all_b.append(list(map(int, d.xyxy[0].tolist())))
        all_c.append(float(d.conf[0]))

    # Tile passes
    rows, cols = tile_grid
    tile_h = int(H / (rows - rows*overlap + overlap))
    tile_w = int(W / (cols - cols*overlap + overlap))
    stride_h = int(tile_h*(1-overlap))
    stride_w = int(tile_w*(1-overlap))

    for r in range(rows):
        for c in range(cols):
            ty1,tx1 = r*stride_h, c*stride_w
            ty2,tx2 = min(ty1+tile_h,H), min(tx1+tile_w,W)
            tile = frame[ty1:ty2, tx1:tx2]
            if tile.size == 0: continue
            up = cv2.resize(tile,(640,640))
            tr = model(up, conf=conf, classes=[0], imgsz=640, verbose=False)[0]
            sx,sy = (tx2-tx1)/640, (ty2-ty1)/640
            for d in tr.boxes:
                bx1,by1,bx2,by2 = d.xyxy[0].tolist()
                all_b.append([int(bx1*sx+tx1),int(by1*sy+ty1),
                               int(bx2*sx+tx1),int(by2*sy+ty1)])
                all_c.append(float(d.conf[0]))

    boxes, confs = nms_boxes(all_b, all_c)
    # Clamp
    clean_b, clean_c = [], []
    for (x1,y1,x2,y2),c in zip(boxes,confs):
        x1,y1 = max(0,x1),max(0,y1)
        x2,y2 = min(x2,W),min(y2,H)
        if x2>x1 and y2>y1:
            clean_b.append([x1,y1,x2,y2])
            clean_c.append(c)
    return clean_b, clean_c


def compute_iou(b1, b2):
    ix1,iy1 = max(b1[0],b2[0]),max(b1[1],b2[1])
    ix2,iy2 = min(b1[2],b2[2]),min(b1[3],b2[3])
    inter = max(0,ix2-ix1)*max(0,iy2-iy1)
    a1=(b1[2]-b1[0])*(b1[3]-b1[1]); a2=(b2[2]-b2[0])*(b2[3]-b2[1])
    return inter/(a1+a2-inter+1e-6)


def extract_features(boxes, shape):
    H,W = shape[:2]
    n = len(boxes)
    if n == 0:
        return dict(count=0,avg_area=0,overlap_ratio=0,spatial_spread=0)
    areas = [(x2-x1)*(y2-y1) for x1,y1,x2,y2 in boxes]
    avg_area = np.mean(areas)/(H*W)
    sample = boxes if n<=50 else [boxes[i] for i in np.random.choice(n,50,replace=False)]
    ns = len(sample)
    ov = sum(1 for i in range(ns) for j in range(i+1,ns)
             if compute_iou(sample[i],sample[j])>0.05)
    overlap_ratio = ov/max(1,ns*(ns-1)//2)
    cx=[(x1+x2)/2/W for x1,y1,x2,y2 in boxes]
    cy=[(y1+y2)/2/H for x1,y1,x2,y2 in boxes]
    spread = float(np.std(cx)+np.std(cy))
    return dict(count=n,avg_area=float(avg_area),
                overlap_ratio=float(overlap_ratio),spatial_spread=spread)


def classify_density(feats):
    n,ov,aa = feats["count"],feats["overlap_ratio"],feats["avg_area"]
    if n == 0: return "LOW", 0.0
    score = min(n/60,1.0)*0.50 + min(ov*2,1.0)*0.30 + (1-min(aa/0.015,1.0))*0.20
    level = "LOW" if score<0.30 else ("MEDIUM" if score<0.60 else "HIGH")
    return level, float(score)


DENSITY_BGR = {"LOW":(0,210,0),"MEDIUM":(0,165,255),"HIGH":(30,30,220)}


def build_heatmap(boxes, shape, sigma=35):
    H,W = shape[:2]
    heat = np.zeros((H,W),dtype=np.float32)
    for x1,y1,x2,y2 in boxes:
        cx,cy = int((x1+x2)/2),int((y1+y2)/2)
        xs,ys = np.arange(W),np.arange(H)
        xx,yy = np.meshgrid(xs,ys)
        heat += np.exp(-((xx-cx)**2+(yy-cy)**2)/(2*sigma**2))
    if heat.max()>0:
        heat = (heat/heat.max()*255).astype(np.uint8)
    return cv2.applyColorMap(heat, cv2.COLORMAP_JET)


def annotate_frame(frame, boxes, confs, level, score, feats, heatmap=True):
    vis = frame.copy()
    H,W = vis.shape[:2]
    color = DENSITY_BGR[level]

    if heatmap and boxes:
        hm = build_heatmap(boxes, vis.shape)
        vis = cv2.addWeighted(vis,0.65,hm,0.35,0)

    for (x1,y1,x2,y2),c in zip(boxes,confs):
        cv2.rectangle(vis,(x1,y1),(x2,y2),color,2)
        cv2.putText(vis,f"{c:.2f}",(x1,max(y1-4,12)),
                    cv2.FONT_HERSHEY_SIMPLEX,0.4,color,1)

    cv2.rectangle(vis,(0,0),(W,90),(12,12,12),-1)
    cv2.putText(vis,f"Density: {level}   ({feats['count']} people)",
                (12,40),cv2.FONT_HERSHEY_DUPLEX,1.1,color,2)
    cv2.putText(vis,f"Overlap:{feats['overlap_ratio']:.2f}  AvgBox:{feats['avg_area']:.5f}  Score:{score:.2f}",
                (12,74),cv2.FONT_HERSHEY_SIMPLEX,0.52,(190,190,190),1)

    # Count badge
    badge=str(feats['count'])
    (bw,bh),_=cv2.getTextSize(badge,cv2.FONT_HERSHEY_DUPLEX,1.7,3)
    cv2.rectangle(vis,(W-bw-26,4),(W-4,bh+18),color,-1)
    cv2.putText(vis,badge,(W-bw-16,bh+10),cv2.FONT_HERSHEY_DUPLEX,1.7,(255,255,255),3)

    if level=="HIGH":
        cv2.rectangle(vis,(0,H-46),(W,H),(20,20,200),-1)
        cv2.putText(vis,"  OVERCROWDING DETECTED",
                    (12,H-13),cv2.FONT_HERSHEY_DUPLEX,0.9,(255,255,255),2)
    return vis


# ──────────────────────────────────────────────────────────────
#  WEBCAM STREAMING STATE
# ──────────────────────────────────────────────────────────────
webcam_running     = False
webcam_lock        = threading.Lock()
webcam_frame_event = threading.Event()   # signals new frame ready
last_webcam_frame  = None


class DensitySmoother:
    def __init__(self, w=8): self.buf=deque(maxlen=w)
    def update(self,s): self.buf.append(s); return float(np.mean(self.buf))
    def level(self,s): return "LOW" if s<0.30 else ("MEDIUM" if s<0.60 else "HIGH")


def fast_detect(frame, conf=0.22):
    """Single-pass 640px detection — fast enough for real-time webcam."""
    res = model(frame, conf=conf, classes=[0], imgsz=640, verbose=False)[0]
    boxes, confs_v = [], []
    for d in res.boxes:
        boxes.append(list(map(int, d.xyxy[0].tolist())))
        confs_v.append(float(d.conf[0]))
    return boxes, confs_v

# ──────────────────────────────────────────────────────────────
#  ROUTES
# ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/model-info")
def model_info():
    return jsonify({"model": MODEL_PATH, "status": "loaded"})


# ── Image inference ───────────────────────────────────────────
@app.route("/api/image", methods=["POST"])
def infer_image():
    if "file" not in request.files:
        return jsonify({"error":"No file uploaded"}),400
    f = request.files["file"]
    if not f.filename: return jsonify({"error":"Empty filename"}),400
    ext = f.filename.rsplit(".",1)[-1].lower()
    if ext not in ALLOWED_IMAGE:
        return jsonify({"error":f"Unsupported type: {ext}"}),400

    conf      = float(request.form.get("conf",0.18))
    heatmap   = request.form.get("heatmap","true").lower()=="true"
    tile_str  = request.form.get("tiles","3")
    tiles     = int(tile_str)

    fname = secure_filename(f.filename)
    path  = UPLOAD_DIR/fname
    f.save(str(path))

    frame = cv2.imread(str(path))
    if frame is None:
        return jsonify({"error":"Could not decode image"}),400

    t0 = time.time()
    boxes,confs = tiled_detect(frame,conf,(tiles,tiles))
    feats = extract_features(boxes,frame.shape)
    level,score = classify_density(feats)
    annotated = annotate_frame(frame,boxes,confs,level,score,feats,heatmap)
    elapsed = round(time.time()-t0,2)

    out_name = f"out_{fname}"
    cv2.imwrite(str(OUTPUT_DIR/out_name), annotated)

    # Encode result as base64
    _,buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY,88])
    b64 = base64.b64encode(buf).decode()

    return jsonify({
        "image":    f"data:image/jpeg;base64,{b64}",
        "level":    level,
        "score":    score,
        "count":    feats["count"],
        "overlap":  feats["overlap_ratio"],
        "avg_area": feats["avg_area"],
        "spread":   feats["spatial_spread"],
        "time":     elapsed,
        "filename": out_name
    })


# ── Video inference ───────────────────────────────────────────
video_progress = {}   # job_id -> progress dict

@app.route("/api/video", methods=["POST"])
def infer_video():
    if "file" not in request.files:
        return jsonify({"error":"No file uploaded"}),400
    f = request.files["file"]
    ext = f.filename.rsplit(".",1)[-1].lower()
    if ext not in ALLOWED_VIDEO:
        return jsonify({"error":f"Unsupported type: {ext}"}),400

    conf    = float(request.form.get("conf",0.18))
    heatmap = request.form.get("heatmap","true").lower()=="true"
    skip    = int(request.form.get("skip","2"))

    fname  = secure_filename(f.filename)
    in_path= UPLOAD_DIR/fname
    f.save(str(in_path))
    job_id = str(int(time.time()*1000))
    out_name = f"out_{job_id}_{fname.rsplit('.',1)[0]}.mp4"
    out_path = OUTPUT_DIR/out_name

    video_progress[job_id] = {"status":"processing","progress":0,
                               "filename":out_name,"log":[]}

    def run():
        cap = cv2.VideoCapture(str(in_path))
        W   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        H   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        tot = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        writer = cv2.VideoWriter(str(out_path),
                                 cv2.VideoWriter_fourcc(*"mp4v"),fps,(W,H))
        sm = DensitySmoother(8)
        last_ann,idx,level_log = None,0,[]
        while True:
            ret,frame = cap.read()
            if not ret: break
            if idx%skip==0:
                boxes,confs_v = tiled_detect(frame,conf,(2,2))
                feats = extract_features(boxes,frame.shape)
                _,raw = classify_density(feats)
                smooth = sm.update(raw)
                lv = sm.level(smooth)
                last_ann = annotate_frame(frame,boxes,confs_v,lv,smooth,feats,heatmap)
                level_log.append(lv)
            writer.write(last_ann if last_ann is not None else frame)
            idx+=1
            pct=int(idx/max(tot,1)*100)
            video_progress[job_id]["progress"]=pct
            if idx%30==0:
                video_progress[job_id]["log"].append(
                    f"Frame {idx}/{tot} | {lv} | {feats.get('count',0)} people")
        cap.release(); writer.release()
        from collections import Counter
        cnt=Counter(level_log); total=max(len(level_log),1)
        video_progress[job_id].update({
            "status":"done","progress":100,
            "summary":{l:f"{cnt[l]/total*100:.1f}%" for l in ["LOW","MEDIUM","HIGH"]}
        })

    threading.Thread(target=run,daemon=True).start()
    return jsonify({"job_id":job_id})


@app.route("/api/video/progress/<job_id>")
def video_progress_route(job_id):
    return jsonify(video_progress.get(job_id,{"status":"not_found"}))


@app.route("/outputs/<path:filename>")
def serve_output(filename):
    return send_from_directory(str(OUTPUT_DIR),filename)


# ── Webcam streaming ──────────────────────────────────────────
#
# Architecture:  TWO threads, one stream
#
#   [reader_thread]  — reads camera at full FPS, stores latest raw frame
#   [detect_thread]  — pulls latest raw frame, runs YOLO, stores annotated bytes
#   [gen_webcam]     — sends annotated bytes to browser as MJPEG
#
# This keeps the stream smooth regardless of YOLO inference speed.
# ──────────────────────────────────────────────────────────────
webcam_cap         = None
webcam_reader_thread  = None
webcam_detect_thread  = None
webcam_frame_bytes = None   # latest annotated JPEG (protected by webcam_lock)
webcam_stats       = {"level": "--", "count": 0, "score": 0.0}

# Shared raw frame between reader and detector
_raw_frame      = None
_raw_frame_lock = threading.Lock()
_raw_frame_event = threading.Event()


def _reader_thread():
    """Drains camera buffer at full speed — keeps _raw_frame fresh."""
    global webcam_cap, _raw_frame
    while webcam_running:
        ret, frame = webcam_cap.read()
        if not ret:
            time.sleep(0.01)
            continue
        with _raw_frame_lock:
            _raw_frame = frame
        _raw_frame_event.set()


def _detect_thread():
    """Runs YOLO on the latest raw frame, encodes result, notifies generator."""
    global webcam_frame_bytes, webcam_stats
    sm = DensitySmoother(5)
    while webcam_running:
        # Wait for a new frame (±100 ms timeout so thread exits cleanly)
        triggered = _raw_frame_event.wait(timeout=0.1)
        _raw_frame_event.clear()
        if not triggered or not webcam_running:
            continue

        with _raw_frame_lock:
            frame = _raw_frame
        if frame is None:
            continue

        # ── YOLO inference ──────────────────────────────────
        boxes, confs_v = fast_detect(frame, conf=0.22)
        feats  = extract_features(boxes, frame.shape)
        _, raw = classify_density(feats)
        smooth = sm.update(raw)
        lv     = sm.level(smooth)
        ann    = annotate_frame(frame, boxes, confs_v, lv, smooth, feats, heatmap=True)

        _, buf = cv2.imencode(".jpg", ann, [cv2.IMWRITE_JPEG_QUALITY, 75])
        frame_bytes = buf.tobytes()

        with webcam_lock:
            webcam_frame_bytes = frame_bytes
            webcam_stats = {"level": lv, "count": feats["count"],
                            "score": round(smooth, 3)}

        webcam_frame_event.set()


def gen_webcam():
    global webcam_frame_bytes
    while webcam_running:
        # Wait up to 1 s for a new frame
        webcam_frame_event.wait(timeout=1.0)
        webcam_frame_event.clear()
        with webcam_lock:
            data = webcam_frame_bytes
        if data:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                   + data + b"\r\n")


@app.route("/api/webcam/start", methods=["POST"])
def webcam_start():
    global webcam_cap, webcam_reader_thread, webcam_detect_thread, \
           webcam_running, webcam_frame_bytes, _raw_frame
    if webcam_running:
        return jsonify({"status": "already running"})

    # Reset shared state
    webcam_frame_bytes = None
    _raw_frame         = None
    webcam_frame_event.clear()
    _raw_frame_event.clear()

    # Open camera — try DirectShow first (lowest latency on Windows)
    webcam_cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not webcam_cap.isOpened():
        webcam_cap = cv2.VideoCapture(0)
    if not webcam_cap.isOpened():
        return jsonify({"error": "Cannot open camera 0"}), 400

    # Set small internal buffer so reader always gets the latest frame
    webcam_cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    webcam_running = True
    webcam_reader_thread = threading.Thread(target=_reader_thread, daemon=True)
    webcam_detect_thread = threading.Thread(target=_detect_thread, daemon=True)
    webcam_reader_thread.start()
    webcam_detect_thread.start()
    return jsonify({"status": "started"})


@app.route("/api/webcam/stop", methods=["POST"])
def webcam_stop():
    global webcam_running, webcam_cap, webcam_frame_bytes, _raw_frame
    webcam_running     = False
    webcam_frame_event.set()   # unblock gen_webcam if waiting
    _raw_frame_event.set()     # unblock detect thread if waiting
    time.sleep(0.1)
    if webcam_cap:
        webcam_cap.release()
        webcam_cap = None
    webcam_frame_bytes = None
    return jsonify({"status": "stopped"})


@app.route("/api/webcam/feed")
def webcam_feed():
    return Response(gen_webcam(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/api/webcam/stats")
def webcam_stats_route():
    return jsonify(webcam_stats)


# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Crowd Density Classifier")
    print(f"  Model : {MODEL_PATH}")
    print("  URL   : http://localhost:5000")
    print("=" * 55)
    app.run(debug=False, host="0.0.0.0", port=5000, threaded=True)