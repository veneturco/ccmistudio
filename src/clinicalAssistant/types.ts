export interface ClinicalProposal {
  id?: string;
  timestamp?: string;
  sourceText?: string;
  extracted?: any;
  status?: 'pending' | 'accepted' | 'rejected' | 'modified';
}
