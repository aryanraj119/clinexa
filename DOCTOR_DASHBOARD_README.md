# Doctor Dashboard - Patient Queue Management System

## 📋 Overview

A comprehensive hospital appointment management system that enables doctors to efficiently manage their patient queue, track consultation progress, and maintain optimal clinic workflow. The system provides real-time queue management with automatic wait time calculations and status tracking.

**Live Repository**: [https://github.com/aryanraj119/clinexa.git](https://github.com/aryanraj119/clinexa.git)

---

## ✨ Key Features

### 🎯 Real-Time Queue Management
- Display all scheduled patients for the day with queue positions
- Automatic queue position assignment based on appointment time
- Real-time status tracking (waiting, in_consultation, completed)
- Current consultation highlighting with patient details

### ⏱️ Automatic Wait Time Calculation
- Calculates estimated waiting time based on consultation duration
- Automatically recalculates when patients complete consultations
- Accurate predictions for remaining patients
- Helps patients plan their time

### 🔄 Efficient Consultation Workflow
- One-click consultation start/complete/skip actions
- Automatic queue recalculation after each completion
- Confirmation dialogs for critical actions
- Auto-refresh every 30 seconds for real-time updates

### 📊 Queue Statistics & Analytics
- Waiting patients count
- Completed consultations count
- Total queue size
- Consultation duration tracking
- Timestamp recording for audit trail

### 👥 Patient Information Display
- Patient name and contact information
- Appointment time and date
- Consultation notes
- Payment information
- Queue position and estimated wait time

---

## 🏗️ System Architecture

### Component Structure
```
DoctorDashboard
├── Navigation Bar
├── Statistics Cards
└── Tabs
    ├── Patient Queue (NEW)
    │   └── PatientQueueManager
    │       ├── Current Consultation Card
    │       ├── Queue Statistics
    │       └── Patient Queue List
    ├── Pending Appointments
    ├── Confirmed Appointments
    └── Completed Appointments
```

### Data Flow
```
Doctor Login
    ↓
Load Dashboard
    ↓
Fetch Today's Appointments
    ↓
Build Patient Queue
    ↓
Calculate Wait Times
    ↓
Display Queue Manager
    ↓
Doctor Starts Consultation
    ↓
Update Status & Timestamps
    ↓
Recalculate Queue
    ↓
Display Next Patient
```

---

## 📁 Project Files

### New Components
- **`src/components/PatientQueueManager.tsx`** - Core queue management component
  - Handles queue display and management
  - Calculates wait times
  - Manages consultation status
  - Provides real-time updates

### Modified Components
- **`src/pages/DoctorDashboard.tsx`** - Enhanced with queue manager integration
  - Added "Patient Queue" tab
  - Integrated PatientQueueManager
  - Maintained existing functionality

### Documentation
- **`DOCTOR_DASHBOARD_DOCUMENTATION.md`** - Complete system documentation
  - System overview and architecture
  - Workflow description
  - Database interaction details
  - Algorithm explanations
  - Feature descriptions

- **`SYSTEM_ARCHITECTURE.md`** - Technical architecture and diagrams
  - System architecture diagrams
  - Data flow diagrams
  - State management details
  - Database schema
  - Performance analysis

- **`IMPLEMENTATION_GUIDE.md`** - Usage guide and best practices
  - Quick start guide
  - Step-by-step workflows
  - Feature explanations
  - Troubleshooting guide
  - Best practices
  - FAQ section

- **`PROJECT_SUMMARY.md`** - Complete project summary
  - Project overview
  - What was built
  - System workflow
  - Technical implementation
  - Deployment information

---

## 🚀 Getting Started

### 1. Access the Doctor Portal
```
Navigate to: /doctor-auth
```

### 2. Sign In
```
Use verified doctor credentials to log in
```

### 3. View Patient Queue
```
Click on "Patient Queue" tab in the dashboard
```

### 4. Manage Consultations
```
- Click "Start" to begin consultation
- Click "Mark Complete" to finish
- Click "Skip" to skip patient
```

---

## 💾 Database Schema

### Appointments Table
```typescript
{
  id: string;                          // Unique ID
  doctor_id: string;                   // Doctor reference
  patient_id: string;                  // Patient reference
  appointment_date: string;            // YYYY-MM-DD
  appointment_time: string;            // HH:MM
  status: string;                      // pending | confirmed | in_consultation | completed | cancelled
  consultation_duration: number;       // Minutes (default: 15)
  consultation_start_time?: string;    // ISO timestamp
  consultation_end_time?: string;      // ISO timestamp
  completed_at?: string;               // ISO timestamp
  notes?: string;                      // Patient notes
  payment_amount: number;              // Consultation fee
  payment_method: string;              // Payment method
}
```

---

## 🔄 Workflow Example

### Morning: Start of Day
```
Doctor logs in
↓
Views Patient Queue tab
↓
Sees 5 patients scheduled:
  1. John Doe (10:00 AM) - Wait: 0 min
  2. Jane Smith (10:15 AM) - Wait: 15 min
  3. Bob Johnson (10:35 AM) - Wait: 35 min
  4. Alice Brown (10:50 AM) - Wait: 50 min
  5. Charlie Davis (11:05 AM) - Wait: 65 min
```

### First Consultation
```
Doctor clicks "Start" for John Doe
↓
John's status changes to "in_consultation"
↓
John highlighted in Current Consultation card
↓
Doctor performs consultation
↓
Doctor clicks "Mark Complete"
↓
Confirmation dialog appears
↓
Doctor confirms
↓
System updates:
  - John's status → "completed"
  - Jane becomes current (Wait: 0 min)
  - Bob's wait time → 20 min (was 35)
  - Alice's wait time → 35 min (was 50)
  - Charlie's wait time → 50 min (was 65)
```

---

## 📊 Wait Time Calculation

### Algorithm
```
For each patient in queue (sorted by appointment time):
  estimated_wait_time = sum of all previous patients' consultation_duration
  
Example:
Patient 1: Duration 15 min → Wait: 0 min
Patient 2: Duration 20 min → Wait: 15 min
Patient 3: Duration 15 min → Wait: 35 min (15+20)
Patient 4: Duration 15 min → Wait: 50 min (15+20+15)
```

### Recalculation
```
When Patient 1 completes:
Patient 2: Duration 20 min → Wait: 0 min (now current)
Patient 3: Duration 15 min → Wait: 20 min (was 35)
Patient 4: Duration 15 min → Wait: 35 min (was 50)
```

---

## 🎨 UI Components

### Current Consultation Card
- Patient name and appointment time
- Contact information
- Consultation notes
- Status badge
- Action buttons (Start/Complete/Skip)

### Queue Statistics
- Waiting patients count
- Completed consultations count
- Total queue size

### Patient Queue List
- Queue position (numbered circle)
- Patient name
- Appointment time
- Estimated wait time
- Status badge
- Action buttons

---

## 🔧 Technical Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks
- **Data Storage**: Browser localStorage
- **Database**: Local JSON-based database
- **Icons**: Lucide React

---

## 📈 Performance

### Time Complexity
- Fetch Queue: O(n log n) - sorting
- Calculate Wait Times: O(n) - single pass
- Start Consultation: O(1) - single update
- Complete Consultation: O(n) - recalculation

### Space Complexity
- Queue Array: O(n) - all patients
- Profile Map: O(m) - all profiles
- User Map: O(m) - all users

### Optimization
- Auto-refresh: 30 seconds
- In-memory caching
- Lazy loading
- Efficient sorting

---

## ✅ Features Implemented

- [x] Real-time queue display
- [x] Automatic wait time calculation
- [x] Queue position tracking
- [x] Current consultation highlighting
- [x] Start consultation action
- [x] Complete consultation action
- [x] Skip patient action
- [x] Queue recalculation
- [x] Status tracking
- [x] Timestamp recording
- [x] Auto-refresh
- [x] Error handling
- [x] Confirmation dialogs
- [x] Patient information display
- [x] Queue statistics
- [x] Responsive design

---

## 🚧 Future Enhancements

- [ ] SMS/Email notifications to patients
- [ ] Detailed consultation notes editor
- [ ] Analytics dashboard
- [ ] Multi-doctor queue management
- [ ] Patient satisfaction ratings
- [ ] Appointment rescheduling
- [ ] Emergency priority queue
- [ ] Video consultation support
- [ ] Mobile app version
- [ ] Real-time notifications

---

## 📚 Documentation

### Quick Links
1. **[DOCTOR_DASHBOARD_DOCUMENTATION.md](./DOCTOR_DASHBOARD_DOCUMENTATION.md)** - System overview
2. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Technical architecture
3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Usage guide
4. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete summary

---

## 🐛 Troubleshooting

### Queue Not Updating
1. Click refresh button
2. Wait 30 seconds for auto-refresh
3. Check browser console for errors
4. Reload page if needed

### Patient Status Not Changing
1. Verify confirmation dialog was clicked
2. Check internet connection
3. Verify localStorage is enabled
4. Try again or refresh

### Wait Times Incorrect
1. Verify consultation duration is set
2. Check appointment times are ordered
3. Refresh queue to recalculate
4. Contact admin if issue persists

---

## 🔐 Security & Privacy

- Data stored in browser localStorage
- No external server communication
- Patient information encrypted
- Access restricted to authenticated doctors
- Secure logout functionality
- Data cleared on logout

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review documentation files
3. Check browser console for errors
4. Contact system administrator

---

## 📝 License

This project is part of the Clinexa healthcare platform.

---

## 🎯 Project Status

✅ **Complete and Deployed**

- Version: 1.0.0
- Last Updated: 2024
- Repository: https://github.com/aryanraj119/clinexa.git
- Branch: main

---

## 👥 Contributors

- Development Team
- Documentation Team
- QA Team

---

## 📞 Contact

For support or inquiries, please contact the development team or visit the GitHub repository.

---

**Thank you for using the Doctor Dashboard Patient Queue Management System!**

For detailed information, please refer to the documentation files included in this project.
