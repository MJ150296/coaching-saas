import type { Repository } from '@/shared/domain';
import { AcademicYear } from '../entities/AcademicYear';
import { ClassMaster } from '../entities/ClassMaster';
import { Section } from '../entities/Section';
import { SubjectAllocation } from '../entities/SubjectAllocation';

export interface AcademicYearRepository extends Repository<AcademicYear, string> {}
export interface ClassMasterRepository extends Repository<ClassMaster, string> {}
export interface SectionRepository extends Repository<Section, string> {}
export interface SubjectAllocationRepository extends Repository<SubjectAllocation, string> {}
