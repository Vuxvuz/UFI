package com.ufit.server.dto.request;

import lombok.Data;

@Data

public class OTPRequest {
    private Long otp;
    private String email;

}