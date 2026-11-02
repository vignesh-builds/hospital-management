package com.hospital.management.repository;

import com.hospital.management.model.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByOccupied(boolean occupied);
}
