package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.NoticeRequest;
import com.smartmunicipal.propertytax.dto.NoticeResponse;

import java.util.List;

public interface NoticeService {

    NoticeResponse generateNotice(NoticeRequest request);

    NoticeResponse findById(Long id);

    List<NoticeResponse> findByPropertyId(Long propertyId);

    List<NoticeResponse> findByStatus(String status);

    List<NoticeResponse> findByNoticeType(String noticeType);

    List<NoticeResponse> findAll();

    NoticeResponse updateStatus(Long id, String status);
}
