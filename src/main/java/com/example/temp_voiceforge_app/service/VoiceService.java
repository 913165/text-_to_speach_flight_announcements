package com.example.temp_voiceforge_app.service;

import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechModel;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class VoiceService {

    private final OpenAiAudioSpeechModel speechModel;

    public VoiceService(OpenAiAudioSpeechModel speechModel) {
        this.speechModel = speechModel;
    }

    public byte[] generateSpeech(String text, String voice) {
        String voiceValue = resolveVoiceValue(voice);

        OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
                .model("gpt-4o-mini-tts")
                .voice(voiceValue)
                .responseFormat(OpenAiAudioApi.SpeechRequest.AudioResponseFormat.MP3)
                .speed(1.0)
                .build();

        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
        TextToSpeechResponse response = speechModel.call(prompt);
        return response.getResult().getOutput();
    }

    private String resolveVoiceValue(String voiceStr) {
        if (voiceStr == null || voiceStr.isBlank()) {
            return OpenAiAudioApi.SpeechRequest.Voice.ALLOY.getValue();
        }
        return Arrays.stream(OpenAiAudioApi.SpeechRequest.Voice.values())
                .filter(v -> v.getValue().equalsIgnoreCase(voiceStr))
                .findFirst()
                .map(OpenAiAudioApi.SpeechRequest.Voice::getValue)
                .orElse(OpenAiAudioApi.SpeechRequest.Voice.ALLOY.getValue());
    }
}

