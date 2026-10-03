import { DocType } from '../types';

export type ShapeType = 
  | 'rectangle' 
  | 'square' 
  | 'circle' 
  | 'callout_corner' 
  | 'badge' 
  | 'underline' 
  | 'checkbox_x' 
  | 'checkbox_check' 
  | 'checkbox_bullet' 
  | 'checkbox_box'
  | 'stamp_area';

export type MarkStyle = 'X' | 'CHECK' | 'BULLET' | 'SQUARE_FILL' | 'CIRCLE_FILL' | 'NONE';

export interface FieldCalibration {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: 'normal' | 'semibold' | 'bold' | '900';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fieldType?: 'text' | 'textarea' | 'date' | 'number' | 'checkbox' | 'stamp' | 'custom' | 'shape';
  placeholder?: string;
  textColor?: string;
  isCustom?: boolean;
  bindKey?: string;
  
  // Advanced PDF & Vector Annotation Properties
  shapeType?: ShapeType;
  markStyle?: MarkStyle;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  fillColor?: string;
  fillOpacity?: number;
  cornerPointer?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  customText?: string;
  isLocked?: boolean;
  zIndex?: number;
  scale?: number;
}

export type DocumentCalibration = Record<string, FieldCalibration>;

export type AllCalibrations = Record<DocType | 'ORDEN_LAB_P2' | string, DocumentCalibration>;
