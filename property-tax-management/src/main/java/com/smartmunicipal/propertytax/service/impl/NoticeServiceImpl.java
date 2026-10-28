package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.NoticeRequest;
import com.smartmunicipal.propertytax.dto.NoticeResponse;
import com.smartmunicipal.propertytax.entity.Notice;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.NoticeRepository;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public NoticeResponse generateNotice(NoticeRequest request) {
        Property property = getPropertyOrThrow(request.getPropertyId());
        User issuedBy = getUserOrThrow(request.getIssuedById());

        Notice notice = Notice.builder()
                .property(property)
                .issuedBy(issuedBy)
                .noticeType(request.getNoticeType())
                .message(request.getMessage())
                .status("ISSUED")
                .build();

        Notice saved = noticeRepository.save(notice);

        // FR8/FR16: notice generation logged with issuer identity
        auditLogService.log(
                issuedBy.getId(),
                "CREATE",
                "Notice",
                saved.getId(),
                "Notice generated: property=" + property.getPropertyId()
                        + " type=" + saved.getNoticeType()
                        + " issuedBy=" + issuedBy.getId(),
                null
        );

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeResponse findById(Long id) {
        return toResponse(getNoticeOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResponse> findByPropertyId(Long propertyId) {
        return noticeRepository.findByPropertyId(propertyId)
                .stream()
                .map(n -> NoticeServiceImpl.toResponse(n))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResponse> findByStatus(String status) {
        return noticeRepository.findByStatus(status)
                .stream()
                .map(n -> NoticeServiceImpl.toResponse(n))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResponse> findByNoticeType(String noticeType) {
        return noticeRepository.findByNoticeType(noticeType)
                .stream()
                .map(n -> NoticeServiceImpl.toResponse(n))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResponse> findAll() {
        return noticeRepository.findAll().stream()
                .map(NoticeServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NoticeResponse updateStatus(Long id, String status) {
        Notice notice = getNoticeOrThrow(id);

        String oldStatus = notice.getStatus();

        notice.setStatus(status);

        Notice saved = noticeRepository.save(notice);

        // FR16: log the authenticated user who changed the notice status
        Long performedById = getCurrentUserId();

        auditLogService.log(
                performedById,
                "UPDATE_STATUS",
                "Notice",
                saved.getId(),
                "Notice status changed from " + oldStatus
                        + " to " + saved.getStatus(),
                null
        );

        return toResponse(saved);
    }

    /**
     * Returns the ID of the currently authenticated user.
     * Authentication is based on the user's email, which is the JWT subject.
     */
    private Long getCurrentUserId() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }

    private Notice getNoticeOrThrow(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Notice not found with id: " + id
                        ));
    }

    private Property getPropertyOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Property not found with id: " + id
                        ));
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        ));
    }

    public static NoticeResponse toResponse(Notice n) {
        return new NoticeResponse(
                n.getId(),
                n.getProperty().getId(),
                n.getProperty().getPropertyId(),
                n.getIssuedBy().getId(),
                n.getIssuedBy().getName(),
                n.getNoticeType(),
                n.getMessage(),
                n.getIssuedDate(),
                n.getStatus()
        );
    }
}