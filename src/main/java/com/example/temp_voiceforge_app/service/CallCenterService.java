package com.example.temp_voiceforge_app.service;

import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.openai.OpenAiAudioSpeechModel;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Base64;
import java.util.Map;

@Service
public class CallCenterService {

    private static final String CALL_CENTER_PROMPT_TEMPLATE = """
            Generate a professional call center response for the following customer issue.

            Customer message:
            {customerMessage}

            Response tone:
            - Polite
            - Professional
            - Empathetic
            - Short (2-3 sentences only)

            Respond directly as the agent. Do not include any label, prefix, or preamble.
            """;

    private final ChatModel chatModel;
    private final OpenAiAudioSpeechModel speechModel;

    public CallCenterService(ChatModel chatModel, OpenAiAudioSpeechModel speechModel) {
        this.chatModel = chatModel;
        this.speechModel = speechModel;
    }

    /**
     * Step 1: Generate a professional call-center reply via GPT.
     * Step 2: Convert that reply to speech via OpenAI TTS.
     *
     * @param customerMessage the raw customer issue text
     * @param voice           the TTS voice name (e.g. "alloy")
     * @return String[2] where [0] = generated response text, [1] = Base64 audio
     */
    public String[] generateCallCenterVoice(String customerMessage, String voice) {
        // ── Step 1: GPT text generation ───────────────────────────────────────
        PromptTemplate template = new PromptTemplate(CALL_CENTER_PROMPT_TEMPLATE);
        Prompt prompt = template.create(Map.of("customerMessage", customerMessage));

        String agentResponse = chatModel.call(prompt)
                .getResult()
                .getOutput()
                .getText();

        // ── Step 2: TTS ───────────────────────────────────────────────────────
        String voiceValue = resolveVoiceValue(voice);

        OpenAiAudioSpeechOptions speechOptions = OpenAiAudioSpeechOptions.builder()
                .model("gpt-4o-mini-tts")
                .voice(voiceValue)
                .responseFormat(OpenAiAudioApi.SpeechRequest.AudioResponseFormat.MP3)
                .speed(1.0)
                .build();

        TextToSpeechPrompt ttsPrompt = new TextToSpeechPrompt(agentResponse, speechOptions);
        TextToSpeechResponse ttsResponse = speechModel.call(ttsPrompt);
        byte[] audioBytes = ttsResponse.getResult().getOutput();
        String audioBase64 = Base64.getEncoder().encodeToString(audioBytes);

        return new String[]{agentResponse, audioBase64};
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

