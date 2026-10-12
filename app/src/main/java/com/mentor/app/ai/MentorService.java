package com.mentor.app.ai;

import org.springframework.stereotype.Service;

@Service
public class MentorService {

    private final MentorAiClient mentorAiClient;
    private final MentorContextService mentorContextService;

    public MentorService(
            MentorAiClient mentorAiClient,
            MentorContextService mentorContextService) {
        this.mentorAiClient = mentorAiClient;
        this.mentorContextService = mentorContextService;
    }

    public MentorChatResponse chat(String message) {
        String context = mentorContextService.buildContext();
        String reply = mentorAiClient.chat(message, context);
        return new MentorChatResponse(reply);
    }
}