package com.hospital.management;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// Uses an in-memory H2 database so tests do not need PostgreSQL
@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class HospitalManagementApplicationTests {

	@Test
	void contextLoads() {
	}

}
