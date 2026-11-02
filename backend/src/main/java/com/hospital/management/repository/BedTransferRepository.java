package com.hospital.management.repository;
import com.hospital.management.model.BedTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BedTransferRepository extends JpaRepository<BedTransfer,Long> {
 List<BedTransfer> findAllByOrderByTransferredAtDesc();
}
