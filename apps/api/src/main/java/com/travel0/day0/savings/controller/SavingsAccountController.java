package com.travel0.day0.savings.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/savings")
@RequiredArgsConstructor
@Tag(name = "적금 상품 관리", description = "적금 금융 API")
public class SavingsAccountController {

}
