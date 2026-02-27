-- Seed users data (passwords are bcrypt hashes)
-- owner@gmail.com / owner@123
INSERT INTO users (email, password, name, role, salon_id) VALUES
('owner@gmail.com', '$2a$10$C0FaMBCt7f83yc3PqNTumOTTYaZFuO74jsegXhA1dXVQXlK30WtoG', 'Salon Owner', 'owner', 1),
('center@gmail.com', '$2a$10$sRk5fHqfvJoy80RposMr7.1Ivlf.iUxAny.xbhV3Vyy86Yovq1vFK', 'Center Manager', 'center', 1),
('staff@gmail.com', '$2a$10$YourHashedPasswordHereForStaff', 'Staff Member', 'staff', 1);


-- Owner Hash: $2a$10$C4yT4Bl0tEUfBG.jNNqShePMmmnk5N.2AJo47tFD2Rl0yOcLVPMBi
-- Center Hash: $2a$10$ewndUngT7QCmVCOrKYZXX.Uj.fP1dMEO1Xa2pv9WWESCQnSGJvDTe