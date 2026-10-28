package com.smartmunicipal.propertytax.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Column(name = "notice_type", nullable = false, length = 50)
    private String noticeType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "issued_date", updatable = false)
    private LocalDateTime issuedDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ISSUED";

    @PrePersist
    protected void onCreate() {
        if (issuedDate == null) {
            issuedDate = LocalDateTime.now();
        }
    }
}
