package com.example.temp_voiceforge_app.dto;

public class CallCenterResponse {

    private String generatedResponseText;
    private String audioBase64;
    private String error;
    private boolean success;

    public CallCenterResponse() {}

    public static CallCenterResponse success(String generatedResponseText, String audioBase64) {
        CallCenterResponse r = new CallCenterResponse();
        r.generatedResponseText = generatedResponseText;
        r.audioBase64 = audioBase64;
        r.success = true;
        return r;
    }

    public static CallCenterResponse failure(String error) {
        CallCenterResponse r = new CallCenterResponse();
        r.error = error;
        r.success = false;
        return r;
    }

    public String getGeneratedResponseText() {
        return generatedResponseText;
    }

    public void setGeneratedResponseText(String generatedResponseText) {
        this.generatedResponseText = generatedResponseText;
    }

    public String getAudioBase64() {
        return audioBase64;
    }

    public void setAudioBase64(String audioBase64) {
        this.audioBase64 = audioBase64;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}

