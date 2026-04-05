package com.example.temp_voiceforge_app.controller;

import com.example.temp_voiceforge_app.dto.RailwayAnnouncementRequest;
import com.example.temp_voiceforge_app.dto.RailwayAnnouncementResponse;
import com.example.temp_voiceforge_app.dto.VoiceRequest;
import com.example.temp_voiceforge_app.dto.VoiceResponse;
import com.example.temp_voiceforge_app.service.RailwayAnnouncementService;
import com.example.temp_voiceforge_app.service.VoiceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@Controller
public class VoiceController {

    private final VoiceService voiceService;
    private final RailwayAnnouncementService railwayAnnouncementService;

    public VoiceController(VoiceService voiceService,
                           RailwayAnnouncementService railwayAnnouncementService) {
        this.voiceService = voiceService;
        this.railwayAnnouncementService = railwayAnnouncementService;
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @PostMapping("/generate-audio")
    public ResponseEntity<byte[]> generateAudio(@RequestBody VoiceRequest request) {
        if (request.getText() == null || request.getText().isBlank())
            return ResponseEntity.badRequest().build();
        String voice = (request.getVoice() == null || request.getVoice().isBlank()) ? "alloy" : request.getVoice();
        try {
            byte[] audio = voiceService.generateSpeech(request.getText(), voice);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentDispositionFormData("attachment", "speech.mp3");
            headers.setContentLength(audio.length);
            return new ResponseEntity<>(audio, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/generate-audio-json")
    @ResponseBody
    public ResponseEntity<VoiceResponse> generateAudioJson(@RequestBody VoiceRequest request) {
        if (request.getText() == null || request.getText().isBlank())
            return ResponseEntity.badRequest().body(VoiceResponse.failure("Text cannot be empty."));
        String voice = (request.getVoice() == null || request.getVoice().isBlank()) ? "alloy" : request.getVoice();
        try {
            byte[] audio = voiceService.generateSpeech(request.getText(), voice);
            return ResponseEntity.ok(VoiceResponse.success(Base64.getEncoder().encodeToString(audio)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(VoiceResponse.failure("Failed to generate audio: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-railway-announcement")
    @ResponseBody
    public ResponseEntity<RailwayAnnouncementResponse> generateRailwayAnnouncement(
            @RequestBody RailwayAnnouncementRequest request) {
        if (request.getTrainNumber() == null || request.getTrainNumber().isBlank())
            return ResponseEntity.badRequest()
                    .body(RailwayAnnouncementResponse.failure("Train number is required."));
        try {
            String[] result = railwayAnnouncementService.generateAnnouncement(request);
            return ResponseEntity.ok(RailwayAnnouncementResponse.success(result[0], result[1]));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(RailwayAnnouncementResponse.failure("Failed to generate announcement: " + e.getMessage()));
        }
    }
}

