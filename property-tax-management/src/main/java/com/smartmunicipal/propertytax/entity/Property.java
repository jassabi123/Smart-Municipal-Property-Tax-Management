package com.smartmunicipal.propertytax.entity;

import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", unique = true, nullable = false)
    private String propertyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "ward_no")
    private String wardNo;

    @Column(name = "area_sqft", precision = 12, scale = 2)
    private BigDecimal areaSqft;

    @Enumerated(EnumType.STRING)
    @Column(name = "construction_type")
    private ConstructionType constructionType;

    @Column(name = "assessed_value", precision = 15, scale = 2)
    private BigDecimal assessedValue;

    @Column(precision = 10, scale = 6)
    private BigDecimal lat;

    @Column(precision = 10, scale = 6)
    private BigDecimal lng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;

    @OneToMany(mappedBy = "property", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @Builder.Default
    private List<TaxAssessment> taxAssessments = new ArrayList<>();

    @OneToMany(mappedBy = "property", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @Builder.Default
    private List<Exemption> exemptions = new ArrayList<>();
}
