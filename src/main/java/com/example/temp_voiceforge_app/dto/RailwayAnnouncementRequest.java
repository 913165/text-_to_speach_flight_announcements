package com.example.temp_voiceforge_app.dto;

public class RailwayAnnouncementRequest {

    // Flight fields (repurposed from railway)
    private String trainNumber;       // flightNumber  e.g. AI-202
    private String trainName;         // airline       e.g. Air India
    private String sourceStation;     // origin        e.g. Mumbai (BOM)
    private String destinationStation;// destination   e.g. Delhi (DEL)
    private String platformNumber;    // gate          e.g. Gate 14B
    private String status;            // On Time / Delayed / Boarding / Gate Changed / Cancelled
    private String delayMinutes;      // optional
    private String terminal;          // Terminal 1 / 2 / T3 etc.

    public RailwayAnnouncementRequest() {}

    public String getTrainNumber() { return trainNumber; }
    public void setTrainNumber(String trainNumber) { this.trainNumber = trainNumber; }

    public String getTrainName() { return trainName; }
    public void setTrainName(String trainName) { this.trainName = trainName; }

    public String getSourceStation() { return sourceStation; }
    public void setSourceStation(String sourceStation) { this.sourceStation = sourceStation; }

    public String getDestinationStation() { return destinationStation; }
    public void setDestinationStation(String destinationStation) { this.destinationStation = destinationStation; }

    public String getPlatformNumber() { return platformNumber; }
    public void setPlatformNumber(String platformNumber) { this.platformNumber = platformNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(String delayMinutes) { this.delayMinutes = delayMinutes; }

    public String getTerminal() { return terminal; }
    public void setTerminal(String terminal) { this.terminal = terminal; }
}
