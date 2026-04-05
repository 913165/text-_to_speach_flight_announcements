package com.example.temp_voiceforge_app.dto;

public class RailwayAnnouncementResponse {

    private String announcementText;
    private String audioBase64;
    private String error;
    private boolean success;

    public RailwayAnnouncementResponse() {}

    public static RailwayAnnouncementResponse success(String announcementText, String audioBase64) {
        RailwayAnnouncementResponse r = new RailwayAnnouncementResponse();
        r.announcementText = announcementText;
        r.audioBase64 = audioBase64;
        r.success = true;
        return r;
    }

    public static RailwayAnnouncementResponse failure(String error) {
        RailwayAnnouncementResponse r = new RailwayAnnouncementResponse();
        r.error = error;
        r.success = false;
        return r;
    }

    public String getAnnouncementText() { return announcementText; }
    public void setAnnouncementText(String announcementText) { this.announcementText = announcementText; }

    public String getAudioBase64() { return audioBase64; }
    public void setAudioBase64(String audioBase64) { this.audioBase64 = audioBase64; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}

