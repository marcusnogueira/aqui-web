import businessTypesData from '../business_types_and_subtypes.json';

export interface BusinessTypesData {
  [key: string]: string[];
}

export const businessTypes: BusinessTypesData = businessTypesData;

export const getBusinessTypeKeys = (): string[] => {
  return Object.keys(businessTypes);
};

export const getSubcategoriesForBusinessType = (businessType: string): string[] => {
  return businessTypes[businessType] || [];
};

export const getAllSubcategories = (): string[] => {
  return Object.values(businessTypes).flat();
};

export const searchSubcategories = (query: string, businessType?: string): string[] => {
  const subcategories = businessType 
    ? getSubcategoriesForBusinessType(businessType)
    : getAllSubcategories();
  
  if (!query) return subcategories;
  
  return subcategories.filter(subcategory => 
    subcategory.toLowerCase().includes(query.toLowerCase())
  );
};