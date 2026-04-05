package com.example.temp_voiceforge_app.dto;

public class VoiceResponse {

    private String audioBase64;
    private String error;
    private boolean success;

    public VoiceResponse() {}

    public static VoiceResponse success(String audioBase64) {
        VoiceResponse r = new VoiceResponse();
        r.audioBase64 = audioBase64;
        r.success = true;
        return r;
    }

    public static VoiceResponse failure(String error) {
        VoiceResponse r = new VoiceResponse();
        r.error = error;
        r.success = false;
        return r;
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

