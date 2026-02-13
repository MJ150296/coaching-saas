import type { Repository } from '@/shared/domain';
import { AcademicYear } from '../entities/AcademicYear';
import { ClassMaster } from '../entities/ClassMaster';
import { Section } from '../entities/Section';
import { SubjectAllocation } from '../entities/SubjectAllocation';

export type AcademicYearRepository = Repository<AcademicYear, string>;
export type ClassMasterRepository = Repository<ClassMaster, string>;
export type SectionRepository = Repository<Section, string>;
export type SubjectAllocationRepository = Repository<SubjectAllocation, string>;
