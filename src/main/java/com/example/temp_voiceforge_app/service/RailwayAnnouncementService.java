package com.example.temp_voiceforge_app.service;

import com.example.temp_voiceforge_app.dto.RailwayAnnouncementRequest;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.openai.OpenAiAudioSpeechModel;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class RailwayAnnouncementService {

    private static final String PROMPT_TEMPLATE = """
            Generate a professional airport public address (PA) announcement for the following flight details.

            Use polite, calm, and formal tone — similar to real airport gate announcements.
            Include the phrase "Ladies and gentlemen" at the start.
            Include relevant passenger instructions based on the status.
            Keep it short — 3 to 4 sentences only.
            Do not add any label, heading, or extra commentary — output the announcement text directly.

            Flight Number: {trainNumber}
            Airline: {trainName}
            From: {sourceStation}
            To: {destinationStation}
            Gate: {platformNumber}
            Terminal: {terminal}
            Status: {status}
            Delay Minutes: {delayMinutes}
            """;

    private final ChatModel chatModel;
    private final OpenAiAudioSpeechModel speechModel;

    public RailwayAnnouncementService(ChatModel chatModel, OpenAiAudioSpeechModel speechModel) {
        this.chatModel = chatModel;
        this.speechModel = speechModel;
    }

    /**
     * Step 1 – Call GPT to generate the flight announcement text.
     * Step 2 – Pass that text to OpenAI TTS (gpt-4o-mini-tts, alloy voice).
     *
     * @return String[2]:  [0] announcement text,  [1] Base64 MP3
     */
    public String[] generateAnnouncement(RailwayAnnouncementRequest req) {

        // ── Step 1 : GPT text generation ─────────────────────────────
        Map<String, Object> vars = new HashMap<>();
        vars.put("trainNumber",        blank(req.getTrainNumber()));
        vars.put("trainName",          blank(req.getTrainName()));
        vars.put("sourceStation",      blank(req.getSourceStation()));
        vars.put("destinationStation", blank(req.getDestinationStation()));
        vars.put("platformNumber",     blank(req.getPlatformNumber()));
        vars.put("terminal",           blank(req.getTerminal()));
        vars.put("status",             blank(req.getStatus()));
        vars.put("delayMinutes",       isBlank(req.getDelayMinutes()) ? "N/A" : req.getDelayMinutes());

        PromptTemplate template = new PromptTemplate(PROMPT_TEMPLATE);
        Prompt prompt = template.create(vars);

        String announcementText = chatModel.call(prompt)
                .getResult()
                .getOutput()
                .getText();

        // ── Step 2 : TTS with fixed alloy voice ──────────────────────
        OpenAiAudioSpeechOptions speechOptions = OpenAiAudioSpeechOptions.builder()
                .model("gpt-4o-mini-tts")
                .voice(OpenAiAudioApi.SpeechRequest.Voice.ALLOY.getValue())
                .responseFormat(OpenAiAudioApi.SpeechRequest.AudioResponseFormat.MP3)
                .speed(1.0)
                .build();

        TextToSpeechPrompt ttsPrompt = new TextToSpeechPrompt(announcementText, speechOptions);
        TextToSpeechResponse ttsResponse = speechModel.call(ttsPrompt);
        String audioBase64 = Base64.getEncoder().encodeToString(
                ttsResponse.getResult().getOutput());

        return new String[]{announcementText, audioBase64};
    }

    private String blank(String val) {
        return (val == null || val.isBlank()) ? "N/A" : val.trim();
    }

    private boolean isBlank(String val) {
        return val == null || val.isBlank();
    }
}
