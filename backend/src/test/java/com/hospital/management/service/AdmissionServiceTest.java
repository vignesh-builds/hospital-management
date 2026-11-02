package com.hospital.management.service;

import com.hospital.management.dto.AdmissionResponse;
import com.hospital.management.dto.AdmitRequest;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.model.Admission;
import com.hospital.management.model.AdmissionStatus;
import com.hospital.management.model.Bed;
import com.hospital.management.model.Bill;
import com.hospital.management.model.Patient;
import com.hospital.management.repository.AdmissionRepository;
import com.hospital.management.repository.BedRepository;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdmissionServiceTest {

    @Mock AdmissionRepository admissionRepository;
    @Mock BedRepository bedRepository;
    @Mock PatientRepository patientRepository;
    @Mock BillRepository billRepository;
    @Mock BillService billService;
    @Mock AccessGuard accessGuard;

    AdmissionService service;

    @BeforeEach
    void setUp() {
        service = new AdmissionService(admissionRepository, bedRepository,
                patientRepository, billRepository, billService, accessGuard);
        ReflectionTestUtils.setField(service, "timezone", "Asia/Kolkata");
    }

    private Patient patient() {
        Patient p = new Patient();
        p.setId(1L);
        p.setName("Ravi");
        return p;
    }

    private Bed bed(boolean occupied) {
        Bed b = new Bed();
        b.setId(7L);
        b.setBedNumber("GW-07");
        b.setWardType("GENERAL");
        b.setDailyRate(1500.0);
        b.setOccupied(occupied);
        return b;
    }

    // ---------- pure billing rules ----------

    @Test
    void sameDayStayIsBilledAsOneDay() {
        LocalDateTime in = LocalDateTime.of(2026, 11, 2, 9, 0);
        assertThat(AdmissionService.billedDays(in, in.plusHours(5))).isEqualTo(1);
    }

    @Test
    void stayIsBilledPerCalendarDay() {
        LocalDateTime in = LocalDateTime.of(2026, 11, 2, 23, 0);
        assertThat(AdmissionService.billedDays(in, LocalDateTime.of(2026, 11, 3, 8, 0))).isEqualTo(1);
        assertThat(AdmissionService.billedDays(in, LocalDateTime.of(2026, 11, 5, 8, 0))).isEqualTo(3);
    }

    @Test
    void roomChargesAreDaysTimesRate() {
        assertThat(AdmissionService.roomCharges(3, 1500.0)).isEqualTo(4500.0);
    }

    // ---------- admit ----------

    @Test
    void admitMarksBedOccupiedAndStoresRateSnapshot() {
        Bed bed = bed(false);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient()));
        when(bedRepository.findById(7L)).thenReturn(Optional.of(bed));
        when(admissionRepository.existsByBedIdAndStatus(7L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.existsByPatientIdAndStatus(1L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> {
            Admission a = i.getArgument(0);
            a.setId(100L);
            return a;
        });
        when(billRepository.findByAdmissionId(100L)).thenReturn(Optional.empty());

        AdmissionResponse response = service.admit(new AdmitRequest(1L, 7L, "Fever"));

        assertThat(bed.isOccupied()).isTrue();
        assertThat(bed.getPatient().getId()).isEqualTo(1L);
        assertThat(response.dailyRate()).isEqualTo(1500.0);
        assertThat(response.status()).isEqualTo("ADMITTED");
    }

    @Test
    void admitRejectsOccupiedBed() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient()));
        when(bedRepository.findById(7L)).thenReturn(Optional.of(bed(true)));

        assertThatThrownBy(() -> service.admit(new AdmitRequest(1L, 7L, "x")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already occupied");
    }

    @Test
    void admitRejectsPatientAlreadyAdmitted() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient()));
        when(bedRepository.findById(7L)).thenReturn(Optional.of(bed(false)));
        when(admissionRepository.existsByBedIdAndStatus(7L, AdmissionStatus.ADMITTED)).thenReturn(false);
        when(admissionRepository.existsByPatientIdAndStatus(1L, AdmissionStatus.ADMITTED)).thenReturn(true);

        assertThatThrownBy(() -> service.admit(new AdmitRequest(1L, 7L, "x")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already admitted");
    }

    // ---------- discharge ----------

    @Test
    void dischargeFreesBedAndCreatesRoomBill() {
        Bed bed = bed(true);
        bed.setPatient(patient());

        Admission admission = new Admission();
        admission.setId(100L);
        admission.setPatient(patient());
        admission.setBed(bed);
        admission.setDailyRate(1500.0);
        admission.setAdmittedAt(LocalDateTime.now().minusDays(3));
        admission.setStatus(AdmissionStatus.ADMITTED);

        Bill bill = new Bill();
        bill.setId(55L);

        when(admissionRepository.findById(100L)).thenReturn(Optional.of(admission));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> i.getArgument(0));
        when(billRepository.findByAdmissionId(100L)).thenReturn(Optional.of(bill));

        AdmissionResponse response = service.discharge(100L);

        assertThat(bed.isOccupied()).isFalse();
        assertThat(bed.getPatient()).isNull();
        assertThat(response.status()).isEqualTo("DISCHARGED");
        assertThat(response.billedDays()).isGreaterThanOrEqualTo(3);
        assertThat(response.roomCharges()).isEqualTo(response.billedDays() * 1500.0);
        assertThat(response.billId()).isEqualTo(55L);
        verify(billService).createForAdmission(admission);
    }

    @Test
    void dischargeTwiceIsRejected() {
        Admission admission = new Admission();
        admission.setId(100L);
        admission.setStatus(AdmissionStatus.DISCHARGED);
        when(admissionRepository.findById(100L)).thenReturn(Optional.of(admission));

        assertThatThrownBy(() -> service.discharge(100L))
                .isInstanceOf(BadRequestException.class);
    }
}
