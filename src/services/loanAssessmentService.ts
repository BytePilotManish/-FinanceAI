import { supabase } from '../lib/supabase/client';
import type { LoanAssessment } from '../lib/supabase/types';

export const loanAssessmentService = {
  async saveAssessment(assessment: Omit<LoanAssessment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('loan_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAssessments() {
    const { data, error } = await supabase
      .from('loan_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAssessmentById(id: string) {
    const { data, error } = await supabase
      .from('loan_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};