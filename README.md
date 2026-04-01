# 🚆 SAARTHI

### Smart Urban Commute Intelligence Platform

**AI-powered crowd prediction, journey planning, and real-time intelligence for Mumbai Local trains**

---

## 📖 Overview

**Saarthi** is a full-stack AI-driven platform designed to solve one of Mumbai’s biggest problems — **unpredictable crowding in local trains**.

It combines:

* 📍 Route planning across **400+ stations**
* 🔴 Real-time crowd intelligence via **NLP + user reports**
* 🤖 Computer vision-based **crowd density detection (YOLOv8)**
* ⚡ Live dashboards, alerts, and predictions


---

## 🧠 Core Idea

Most commute apps tell you *when* to travel.
Saarthi tells you **how crowded your journey will be before you even leave**.

---

## 🏗️ System Architecture

```
Frontend (React)
        ↓
Node.js Backend (Express API)
        ↓
-----------------------------------
| NLP Service (Flask)             |
| Crowd Classification           |
-----------------------------------
-----------------------------------
| CV Service (Flask + YOLOv8)     |
| Density Detection              |
-----------------------------------
        ↓
MongoDB + Static Dataset
```

---

## ✨ Key Features

### 🗺️ Journey Planning

* Search routes across **400+ Mumbai stations**
* Supports **multi-interchange routes**
* Displays:

  * Departure & arrival time
  * Fare estimation (₹)
  * Stops & segments
* 🧠 Smart crowd overlay based on time-slot mapping

---

### 🔴 Crowd Intelligence Dashboard

* Live **heatmap of stations**
* Crowd levels:

  * 🟢 Low
  * 🟡 Moderate
  * 🔴 High
* Real-time updates using:

  * NLP-based user reports
  * Time-decay algorithm (×0.90 per minute)
* ⚡ Auto-refresh every 5 seconds
* 🚨 Smart alerts for overcrowded stations

---

### 🤖 YOLOv8 Crowd Density Detection

* Upload **image / video / webcam stream**
* Detects:

  * People count
  * Density level (LOW / MEDIUM / HIGH)
* Uses:

  * Grid-based detection (3×3 tiling)
  * Full-frame + patch inference
* Outputs:

  * Bounding boxes
  * Heatmap overlay
  * Density score

---

### 🧾 NLP Crowd Reporting System

* Users submit natural language input:

  ```
  "Andheri is packed right now"
  ```
* Model:

  * TF-IDF + Logistic Regression
* Output:

  * Crowd classification
* Updates live heatmap instantly

---

### 🔐 Authentication System

* JWT-based authentication
* Secure login/register
* Protected routes
* Password hashing using bcrypt

---

## 🧪 Machine Learning Notebooks

### 📊 Crowd Density Detection

**File:** `Crowd_Density_v2_FullDetection.ipynb`

* YOLO-based detection experiments
* Grid-based tiling for dense scenes
* Performance tuning & inference testing
* Forms the base of CV microservice

---

### 🧾 NLP Crowd Detection

**File:** `NLP_Crowd_Detection_System.ipynb`

* Text preprocessing & cleaning
* TF-IDF vectorization
* Logistic Regression classifier
* Evaluation metrics & analysis

---

## 🛠️ Tech Stack

### Frontend

* React 19
* Vite
* TailwindCSS
* Framer Motion
* Leaflet

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Auth

### AI / ML

* Python (Flask)
* YOLOv8 (Ultralytics)
* OpenCV
* Scikit-learn

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/Saarthi---Urban-Commute.git
cd Saarthi---Urban-Commute
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
PORT=5000
```

Run:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### 4. NLP Service

```bash
cd python
pip install flask flask-cors scikit-learn
python chatting.py
```

---

### 5. YOLOv8 Service

```bash
pip install ultralytics opencv-python numpy
python app.py
```

---

## 🔌 API Endpoints

### Backend

* `/api/auth/login`
* `/api/journey/search`
* `/api/crowd/predict`
* `/api/profile`

### NLP Service

* `/chat`
* `/heatmap`
* `/alerts`

### CV Service

* `/api/image`
* `/api/video`
* `/api/webcam`

---

## 📁 Dataset

* Mumbai local timetable dataset
* Station list (~400+ stations)
* Crowd timeline dataset

---


## 🔮 Future Improvements

* Deep learning NLP model (BERT)
* Real CCTV/live feed integration
* Mobile app
* Predictive crowd forecasting (LSTM / Time-series)
* Live train delay integration

---

## 🤝 Contributing

1. Fork the repo
2. Create branch
3. Commit changes
4. Open PR

---


If you want next level:
I can turn this into a **killer hackathon pitch + GitHub that recruiters actually remember**.
