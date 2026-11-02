package com.hospital.management.controller;
import com.hospital.management.dto.BedResponse;
import com.hospital.management.exception.*;
import com.hospital.management.model.*;
import com.hospital.management.repository.*;
import com.hospital.management.service.AccessGuard;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
@RestController @RequestMapping("/beds")
public class BedController {
 private final BedRepository beds; private final AdmissionRepository admissions; private final PatientRepository patients;
 private final BedTransferRepository transfers; private final AccessGuard guard;
 public BedController(BedRepository b,AdmissionRepository a,PatientRepository p,BedTransferRepository t,AccessGuard g){beds=b;admissions=a;patients=p;transfers=t;guard=g;}
 @GetMapping public List<BedResponse> all(){String role=guard.currentRole();boolean staff=!role.equals("PATIENT");return beds.findAll().stream().map(b->dto(b,staff)).toList();}
 @PreAuthorize("hasRole('ADMIN')") @PostMapping public BedResponse create(@RequestBody Bed in){
  if(in.getBedNumber()==null||in.getBedNumber().isBlank())throw new BadRequestException("Bed number is required");
  double rate=in.getDailyRate()==null?0:in.getDailyRate();if(rate<0)throw new BadRequestException("Daily rate cannot be negative");
  Bed b=new Bed();b.setBedNumber(in.getBedNumber().trim());b.setWardType(in.getWardType());b.setDailyRate(rate);b.setStatus("AVAILABLE");return dto(beds.save(b),true);
 }
 @PreAuthorize("hasRole('ADMIN')") @PutMapping("/{id}") public BedResponse update(@PathVariable Long id,@RequestBody Bed in){
  Bed b=get(id);if(b.isOccupied()||"RESERVED".equals(b.getStatus()))throw new BadRequestException("Cannot edit occupied/reserved bed");
  if(in.getBedNumber()==null||in.getBedNumber().isBlank())throw new BadRequestException("Bed number required");
  double rate=in.getDailyRate()==null?0:in.getDailyRate();if(rate<0)throw new BadRequestException("Invalid daily rate");
  if(beds.findAll().stream().anyMatch(x->!x.getId().equals(id)&&x.getBedNumber().equalsIgnoreCase(in.getBedNumber().trim())))throw new BadRequestException("Bed number already exists");
  b.setBedNumber(in.getBedNumber().trim());b.setWardType(in.getWardType());b.setDailyRate(rate);return dto(beds.save(b),true);
 }
 @PreAuthorize("hasRole('ADMIN')") @DeleteMapping("/{id}") public void delete(@PathVariable Long id){Bed b=get(id);if(b.isOccupied()||admissions.existsByBedId(id))throw new BadRequestException("Bed has occupancy/history");beds.delete(b);}
 @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','NURSE','WARD_IN_CHARGE')") @PutMapping("/{id}/status")
 public BedResponse legacyStatus(@PathVariable Long id,@RequestParam boolean occupied){
  Bed b=get(id);
  if(admissions.existsByBedIdAndStatus(id,AdmissionStatus.ADMITTED)) throw new BadRequestException("Use discharge for an admitted patient");
  b.setOccupied(occupied);b.setStatus(occupied?"OCCUPIED":"AVAILABLE");
  if(!occupied)b.setPatient(null);
  return dto(beds.save(b),true);
 }
 @PreAuthorize("hasAnyRole('ADMIN','WARD_IN_CHARGE')") @PutMapping("/{id}/maintenance") public BedResponse maintenance(@PathVariable Long id,@RequestParam boolean enabled){
  Bed b=get(id);if(b.isOccupied()||"RESERVED".equals(b.getStatus()))throw new BadRequestException("Occupied/reserved bed cannot enter maintenance");
  b.setStatus(enabled?"MAINTENANCE":"AVAILABLE");return dto(beds.save(b),true);
 }
 @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','WARD_IN_CHARGE')") @PostMapping("/{id}/reserve") public BedResponse reserve(@PathVariable Long id,@RequestBody ReserveRequest req){
  Bed b=get(id);if(b.isOccupied()||!"AVAILABLE".equals(b.getStatus()))throw new BadRequestException("Bed is not available");
  Patient p=patients.findById(req.patientId()).orElseThrow(()->new ResourceNotFoundException("Patient not found"));
  b.setStatus("RESERVED");b.setReservedPatient(p);b.setReservedUntil(req.reservedUntil()==null?null:LocalDateTime.parse(req.reservedUntil()));return dto(beds.save(b),true);
 }
 @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','WARD_IN_CHARGE')") @DeleteMapping("/{id}/reservation") public BedResponse cancel(@PathVariable Long id){
  Bed b=get(id);if(!"RESERVED".equals(b.getStatus()))throw new BadRequestException("Bed is not reserved");
  b.setStatus("AVAILABLE");b.setReservedPatient(null);b.setReservedUntil(null);return dto(beds.save(b),true);
 }
 @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','NURSE','WARD_IN_CHARGE')") @PostMapping("/transfer") @Transactional
 public Map<String,String> transfer(@RequestBody TransferRequest req){
  Admission a=admissions.findById(req.admissionId()).orElseThrow(()->new ResourceNotFoundException("Admission not found"));
  if(a.getStatus()!=AdmissionStatus.ADMITTED)throw new BadRequestException("Patient is not currently admitted");
  Bed from=a.getBed(),to=get(req.toBedId());if(from.getId().equals(to.getId()))throw new BadRequestException("Select a different bed");
  if(to.isOccupied()||!"AVAILABLE".equals(to.getStatus()))throw new BadRequestException("Destination bed is not available");
  from.setOccupied(false);from.setPatient(null);from.setStatus("AVAILABLE");beds.save(from);
  to.setOccupied(true);to.setPatient(a.getPatient());to.setStatus("OCCUPIED");beds.save(to);a.setBed(to);admissions.save(a);
  BedTransfer t=new BedTransfer();t.setAdmission(a);t.setFromBed(from);t.setToBed(to);t.setTransferredAt(LocalDateTime.now());
  t.setReason(req.reason());t.setTransferredBy(guard.currentUser().getEmail());transfers.save(t);
  return Map.of("message","Patient transferred","fromBed",from.getBedNumber(),"toBed",to.getBedNumber());
 }
 @PreAuthorize("hasAnyRole('ADMIN','WARD_IN_CHARGE')") @GetMapping("/transfers") public List<Map<String,Object>> history(){
  return transfers.findAllByOrderByTransferredAtDesc().stream().map(t->Map.<String,Object>of("id",t.getId(),"patient",t.getAdmission().getPatient().getName(),"from",t.getFromBed().getBedNumber(),"to",t.getToBed().getBedNumber(),"at",t.getTransferredAt().toString(),"reason",t.getReason()==null?"":t.getReason())).toList();
 }
 private Bed get(Long id){
  Bed b=beds.findById(id).orElseThrow(()->new ResourceNotFoundException("Bed not found"));
  if(b.getStatus()==null){b.setStatus(b.isOccupied()?"OCCUPIED":"AVAILABLE");b=beds.save(b);}
  return b;
 }
 private BedResponse dto(Bed b,boolean staff){Admission a=staff&&b.isOccupied()?admissions.findByBedIdAndStatus(b.getId(),AdmissionStatus.ADMITTED).orElse(null):null;
  return new BedResponse(b.getId(),b.getBedNumber(),b.getWardType(),b.isOccupied(),b.getDailyRate(),a==null?null:a.getId(),a==null?null:a.getPatient().getId(),a==null?null:a.getPatient().getName(),a==null||a.getAdmittedAt()==null?null:a.getAdmittedAt().toString(),(b.getStatus()==null?(b.isOccupied()?"OCCUPIED":"AVAILABLE"):b.getStatus()),b.getReservedPatient()==null?null:b.getReservedPatient().getName(),b.getReservedUntil()==null?null:b.getReservedUntil().toString());}
 public record ReserveRequest(Long patientId,String reservedUntil){}
 public record TransferRequest(Long admissionId,Long toBedId,String reason){}
}
