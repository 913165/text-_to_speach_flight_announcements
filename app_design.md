Enhance Spring AI Voice Studio project to generate railway announcements.

Create form fields:

trainNumber
trainName
sourceStation
destinationStation
platformNumber
status

status dropdown values:

On Time
Delayed
Arriving
Platform Changed
Cancelled

delayMinutes (optional)

When user clicks Generate Announcement:

Step 1:
Call GPT model using Spring AI.

Prompt:

Generate Indian railway style public announcement.

Use polite formal tone.

Format similar to railway station announcements.

Include phrases:

"Attention please"
"Passengers are requested"

Input:

Train Number: {trainNumber}
Train Name: {trainName}
From: {source}
To: {destination}
Platform: {platform}
Status: {status}
Delay Minutes: {delayMinutes}

Output:
short announcement (3-4 lines)

Step 2:
Send generated text to OpenAI TTS model:

model:
gpt-4o-mini-tts

voice:
alloy

Step 3:
Return:

announcementText
audio file

UI:

Show:

Generated announcement text
Audio player
Download button