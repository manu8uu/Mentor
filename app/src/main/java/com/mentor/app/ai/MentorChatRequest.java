
package com.mentor.app.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MentorChatRequest(
        @NotBlank(message = "El mensaje no puede estar vacío")
        @Size(max = 4000, message = "El mensaje no puede superar los 4000 caracteres")
        String message
) {
}
