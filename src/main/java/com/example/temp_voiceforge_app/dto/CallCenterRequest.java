package com.example.temp_voiceforge_app.dto;

public class CallCenterRequest {

    private String customerMessage;
    private String voice;

    public CallCenterRequest() {}

    public String getCustomerMessage() {
        return customerMessage;
    }

    public void setCustomerMessage(String customerMessage) {
        this.customerMessage = customerMessage;
    }

    public String getVoice() {
        return voice;
    }

    public void setVoice(String voice) {
        this.voice = voice;
    }
}

