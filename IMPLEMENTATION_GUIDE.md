# Doctor Dashboard - Implementation Guide & Usage

## Quick Start Guide

### 1. Accessing the Doctor Dashboard

1. Navigate to the Doctor Portal: `/doctor-auth`
2. Sign in with verified doctor credentials
3. You will be redirected to `/doctor-dashboard`
4. Click on the "Patient Queue" tab to access the queue management system

### 2. Understanding the Queue Interface

#### Current Consultation Card
- **Location**: Top of the Patient Queue tab
- **Purpose**: Displays the patient currently being consulted
- **Information Shown**:
  - Patient name
  - Appointment time
  - Contact information
  - Consultation notes
  - Current status badge

#### Queue Statistics
- **Waiting Patients**: Number of patients waiting for consultation
- **Completed Today**: Number of consultations completed
- **Total Queue**: Total number of scheduled patients

#### Patient Queue List
- **Queue Position**: Numbered position (1, 2, 3, etc.)
- **Patient Name**: Full name of the patient
- **Appointment Time**: Scheduled appointment time
- **Wait Time**: Estimated waiting time in minutes
- **Status Badge**: Visual indicator of patient status
- **Action Buttons**: Start, Complete, or Skip buttons

---

## Workflow: Step-by-Step

### Scenario: Managing a Day's Consultations

#### Morning: Start of Day

```
1. Doctor logs in to dashboard
2. Views "Patient Queue" tab
3. Sees all confirmed appointments for today
4. Queue shows:
   - Patient 1: John Doe (10:00 AM) - Wait: 0 min
   - Patient 2: Jane Smith (10:15 AM) - Wait: 15 min
   - Patient 3: Bob Johnson (10:35 AM) - Wait: 35 min
```

#### First Consultation

```
1. Doctor clicks "Start" button for Patient 1
2. System updates:
   - Patient 1 status → "in_consultation"
   - Patient 1 highlighted in Current Consultation card
   - Button changes to "Mark Complete" and "Skip Patient"
3. Doctor performs consultation
4. Doctor clicks "Mark Complete"
5. Confirmation dialog appears
6. Doctor confirms completion
7. System updates:
   - Patient 1 status → "completed"
   - Patient 1 moved to Completed section
   - Patient 2 becomes current consultation
   - Wait times recalculated:
     * Patient 2: Wait 0 min (now current)
     * Patient 3: Wait 20 min (was 35, now 35-15=20)
```

#### Handling Multiple Patients

```
Throughout the day:
- Doctor starts each patient consultation
- Completes consultation when done
- System automatically updates queue
- Wait times adjust for remaining patients
- Completed patients accumulate in summary

End of Day Summary:
- 8 patients completed
- 2 patients pending (not shown up)
- 1 patient cancelled
- Total consultations: 8
```

---

## Key Features Explained

### 1. Automatic Wait Time Calculation

**How It Works:**
- Each appointment has a `consultation_duration` (default: 15 minutes)
- Wait time = sum of all consultation durations before this patient
- Automatically recalculated when a patient completes

**Example:**
```
Patient 1: 10:00 AM, Duration: 15 min → Wait: 0 min
Patient 2: 10:15 AM, Duration: 20 min → Wait: 15 min
Patient 3: 10:35 AM, Duration: 15 min → Wait: 35 min (15+20)
Patient 4: 10:50 AM, Duration: 15 min → Wait: 50 min (15+20+15)

After Patient 1 completes:
Patient 2: Duration: 20 min → Wait: 0 min (now current)
Patient 3: Duration: 15 min → Wait: 20 min (was 35)
Patient 4: Duration: 15 min → Wait: 35 min (was 50)
```

### 2. Queue Position Management

**Position Assignment:**
- Positions are assigned based on appointment time order
- Position 1 = first appointment of the day
- Position updates when patients complete or are skipped

**Visual Indicator:**
- Large numbered circle shows position
- Color-coded by status:
  - Blue circle: Current consultation
  - Yellow badge: Waiting
  - Green badge: Completed

### 3. Status Tracking

**Status States:**
- **Waiting**: Patient scheduled, not yet consulted
- **In Consultation**: Doctor currently consulting with patient
- **Completed**: Consultation finished, patient can leave
- **Cancelled**: Patient skipped or no-show

**Status Transitions:**
```
waiting → in_consultation → completed
   ↓
   └─→ cancelled (if skipped)
```

### 4. Real-Time Updates

**Auto-Refresh:**
- Queue refreshes every 30 seconds
- Ensures data stays current
- Prevents stale information

**Manual Refresh:**
- Doctor can manually refresh if needed
- Useful if system feels out of sync

---

## Database Operations

### What Happens When You Start a Consultation

```typescript
// Database Update
{
  appointment_id: "apt-123",
  status: "in_consultation",
  consultation_start_time: "2024-01-15T10:00:00Z"
}

// Stored in localStorage as:
{
  "appointments": [
    {
      "id": "apt-123",
      "status": "in_consultation",
      "consultation_start_time": "2024-01-15T10:00:00Z",
      ...
    }
  ]
}
```

### What Happens When You Complete a Consultation

```typescript
// Database Update
{
  appointment_id: "apt-123",
  status: "completed",
  consultation_end_time: "2024-01-15T10:15:00Z",
  completed_at: "2024-01-15T10:15:00Z"
}

// Stored in localStorage as:
{
  "appointments": [
    {
      "id": "apt-123",
      "status": "completed",
      "consultation_end_time": "2024-01-15T10:15:00Z",
      "completed_at": "2024-01-15T10:15:00Z",
      ...
    }
  ]
}
```

### What Happens When You Skip a Patient

```typescript
// Database Update
{
  appointment_id: "apt-123",
  status: "cancelled",
  cancellation_reason: "Skipped by doctor"
}

// Patient removed from queue
// Next patient becomes current
// Wait times recalculated
```

---

## Advanced Features

### 1. Patient Information Display

**Available Information:**
- Patient name
- Appointment time
- Phone number (if available)
- Email (if available)
- Consultation notes
- Payment amount and method

**How to Access:**
- Click on patient in queue list
- Information displayed in card
- Current consultation card shows all details

### 2. Consultation Duration Tracking

**Automatic Tracking:**
- `consultation_start_time`: Recorded when consultation starts
- `consultation_end_time`: Recorded when consultation completes
- Actual duration = end_time - start_time

**Use Cases:**
- Track average consultation time
- Identify time-consuming cases
- Optimize scheduling

### 3. Completed Consultations Summary

**Summary Card:**
- Shows all completed patients for the day
- Displays checkmark (✓) for each completed patient
- Helps track daily progress

**Information Tracked:**
- Patient name
- Completion time
- Consultation duration
- Total consultations completed

---

## Troubleshooting

### Issue: Queue Not Updating

**Solution:**
1. Click "Refresh" button (if available)
2. Wait 30 seconds for auto-refresh
3. Check browser console for errors
4. Reload page if issue persists

### Issue: Patient Status Not Changing

**Solution:**
1. Ensure you clicked confirmation dialog
2. Check internet connection
3. Verify localStorage is enabled
4. Try again or refresh page

### Issue: Wait Times Incorrect

**Solution:**
1. Verify consultation duration is set correctly
2. Check appointment times are in correct order
3. Refresh queue to recalculate
4. Contact admin if issue persists

### Issue: Cannot Start Consultation

**Solution:**
1. Verify patient status is "waiting"
2. Check you have doctor permissions
3. Ensure appointment is confirmed
4. Try refreshing page

---

## Best Practices

### 1. Time Management

- **Set Realistic Durations**: Adjust consultation_duration based on appointment type
- **Buffer Time**: Add 5-10 minutes between consultations for notes
- **Lunch Breaks**: Mark unavailable times in schedule

### 2. Patient Communication

- **Display Wait Times**: Patients can see estimated wait time
- **Update Regularly**: Queue updates every 30 seconds
- **Notify Next Patient**: System highlights next patient

### 3. Queue Management

- **Start on Time**: Begin consultations at scheduled times
- **Complete Promptly**: Mark consultations complete when done
- **Skip Appropriately**: Only skip if patient is no-show

### 4. Data Accuracy

- **Verify Patient Info**: Check patient details before starting
- **Record Notes**: Add consultation notes for future reference
- **Update Status**: Always mark consultation complete

---

## Performance Tips

### 1. Optimize Consultation Duration

- Set accurate consultation_duration for each appointment type
- Reduces wait time calculation errors
- Improves queue accuracy

### 2. Manage Queue Size

- Limit appointments per day to manageable number
- Prevents queue from becoming too long
- Improves system performance

### 3. Regular Breaks

- Schedule breaks between consultations
- Prevents doctor fatigue
- Improves consultation quality

---

## Integration with Other Features

### Pending Appointments Tab

- Shows appointments awaiting confirmation
- Confirm appointments before they appear in queue
- Helps manage appointment flow

### Confirmed Appointments Tab

- Shows all confirmed appointments
- Can mark complete from this view
- Alternative to queue management

### Completed Appointments Tab

- Shows all completed consultations
- Historical record of the day
- Useful for reporting

---

## Reporting & Analytics

### Daily Statistics

**Available Metrics:**
- Total appointments: 10
- Pending: 2
- Confirmed: 8
- Completed: 6
- Cancelled: 2

**Tracked Data:**
- Consultation start time
- Consultation end time
- Actual consultation duration
- Patient wait time
- Completion status

### Future Enhancements

- Average consultation duration
- Peak hours analysis
- Patient satisfaction ratings
- Doctor productivity metrics
- Queue efficiency reports

---

## Security & Privacy

### Data Protection

- All data stored in browser localStorage
- No data sent to external servers
- Patient information encrypted in storage
- Access restricted to authenticated doctors

### Privacy Considerations

- Only show patient info to assigned doctor
- Don't display sensitive medical info in queue
- Secure logout when done
- Clear data on logout

---

## FAQ

**Q: How often does the queue update?**
A: Automatically every 30 seconds, or manually by refreshing.

**Q: Can I change a patient's consultation duration?**
A: Yes, update the consultation_duration field in the appointment record.

**Q: What happens if a patient doesn't show up?**
A: Click "Skip Patient" to mark them as cancelled and move to next patient.

**Q: Can I undo a completed consultation?**
A: No, but you can contact admin to modify the record.

**Q: How are wait times calculated?**
A: Sum of all consultation durations before the patient in queue.

**Q: Can multiple doctors use the system simultaneously?**
A: Yes, each doctor has their own queue based on their appointments.

**Q: What if the system crashes?**
A: Data is saved in localStorage, will be restored on reload.

**Q: Can patients see the queue?**
A: Not in current version, but can be added as future feature.

---

## Support & Contact

For issues or questions:
1. Check troubleshooting section above
2. Review documentation files
3. Contact system administrator
4. Check browser console for error messages

---

## Conclusion

The Doctor Dashboard Patient Queue Management System provides an efficient, user-friendly solution for managing patient consultations. By following this guide and best practices, doctors can optimize their consultation process, improve patient satisfaction, and maintain accurate appointment records.
