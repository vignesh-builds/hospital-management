package com.hospital.management.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="bed_transfers")
public class BedTransfer {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) private Admission admission;
 @ManyToOne(optional=false) private Bed fromBed;
 @ManyToOne(optional=false) private Bed toBed;
 private LocalDateTime transferredAt;
 private String reason;
 private String transferredBy;
 public Long getId(){return id;} public Admission getAdmission(){return admission;}
 public void setAdmission(Admission v){admission=v;} public Bed getFromBed(){return fromBed;}
 public void setFromBed(Bed v){fromBed=v;} public Bed getToBed(){return toBed;}
 public void setToBed(Bed v){toBed=v;} public LocalDateTime getTransferredAt(){return transferredAt;}
 public void setTransferredAt(LocalDateTime v){transferredAt=v;} public String getReason(){return reason;}
 public void setReason(String v){reason=v;} public String getTransferredBy(){return transferredBy;}
 public void setTransferredBy(String v){transferredBy=v;}
}
