Description: Validate the system with at least three rooms, ensuring 
performance and correctness.

Tasks:

Create Test Room JSONs:
Define room1.json, room2.json, room3.json with unique layouts and 
interconnected doors.
Test Transitions:
Navigate between rooms, verifying entity persistence and player 
positioning.
Monitor Performance:
Check memory usage and frame rate with browser dev tools during 
transitions.
Acceptance Criteria:

Three rooms load and transition correctly.
Entity states (e.g., moved boulders) persist across visits.
No noticeable performance degradation (e.g., frame drops, memory leaks).
