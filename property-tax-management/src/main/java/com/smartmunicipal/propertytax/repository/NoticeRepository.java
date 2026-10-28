package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Notice;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // Notices for a property — SRS Section 1.2: arrear recovery notices per property
    List<Notice> findByProperty(Property property);

    // Notices by property ID — SRS Appendix H: POST /api/notices/generate
    List<Notice> findByPropertyId(Long propertyId);

    // Notices issued by an officer — SRS FR3: officer-scoped access
    List<Notice> findByIssuedBy(User issuedBy);

    // Notices by type — SRS Section 1.2: ARREAR, RECOVERY, REMINDER etc.
    List<Notice> findByNoticeType(String noticeType);

    // Notices by status — SRS FR5: workflow status tracking
    List<Notice> findByStatus(String status);

    // Notices within a date range — SRS FR9: analytics and reporting
    List<Notice> findByIssuedDateBetween(LocalDateTime from, LocalDateTime to);

    // Notices by property and type — SRS: targeted notice lookup
    List<Notice> findByPropertyIdAndNoticeType(Long propertyId, String noticeType);
}
