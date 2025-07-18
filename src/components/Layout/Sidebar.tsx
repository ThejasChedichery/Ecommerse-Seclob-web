import React, { useState, useEffect } from 'react';
import { Menu, Spin } from 'antd';
import { categoryAPI, subCategoryAPI, productAPI } from '../../utils/api';

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
  description: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  subCategoryId: string;
  variants: Array<{ ram: string; price: number; quantity: number }>;
  images: string[];
}

interface SidebarProps {
  onCategorySelect?: (category: string, categoryId?: string) => void;
  onSubCategorySelect?: (subCategory: string, subCategoryId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, onSubCategorySelect }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<{ [key: string]: SubCategory[] }>({});
  const [productsMap, setProductsMap] = useState<{ [key: string]: Product[] }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All categories');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategoriesAndSubCategories();
  }, []);

  useEffect(() => {
    console.log('=== subCategoriesMap changed ===');
    console.log('Current subCategoriesMap:', subCategoriesMap);
    console.log('Categories:', categories);
  }, [subCategoriesMap, categories]);

  useEffect(() => {
    console.log('=== expandedCategories changed ===');
    console.log('New expanded categories:', expandedCategories);
  }, [expandedCategories]);

  const fetchCategoriesAndSubCategories = async () => {
    try {
      setLoading(true);
      console.log('=== Loading Categories and Subcategories ===');
      
      // First fetch categories
      const response = await categoryAPI.getAllCategories();
      console.log('Categories response:', response);
      const categoriesData = response.data || response;
      setCategories(categoriesData);
      
      // Then fetch subcategories for each category
      console.log('Fetching subcategories for all categories...');
      await Promise.all(
        categoriesData.map(async (category: Category) => {
          console.log(`Fetching subcategories for category: ${category.name} (${category._id})`);
          await fetchSubCategoriesByCategory(category._id);
        })
      );
      
      console.log('All categories and subcategories loaded successfully');
    } catch (error: any) {
      console.error('Failed to fetch categories and subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategoriesByCategory = async (categoryId: string) => {
    try {
      
      const response = await subCategoryAPI.getSubCategoriesByCategory(categoryId);
   
      const subCategoriesData = response.data || response;
      console.log('Processed subcategories data:', subCategoriesData);
      
      setSubCategoriesMap(prev => {
        const newMap = {
          ...prev,
          [categoryId]: subCategoriesData
        };
        console.log('Updated subCategoriesMap:', newMap);
        return newMap;
      });
      
      console.log('Subcategories fetch completed successfully');
    } catch (error: any) {
    
      
      // Set empty array if no subcategories found
      setSubCategoriesMap(prev => ({
        ...prev,
        [categoryId]: []
      }));
    }
  };

  const fetchProductsBySubCategory = async (subCategoryId: string) => {
    try {
      console.log('Fetching products for subCategoryId:', subCategoryId);
      const response = await productAPI.getAllProducts({ subCategory: subCategoryId });
      console.log('Products response:', response);
      const productsData = response.data || response;
      
      setProductsMap(prev => ({
        ...prev,
        [subCategoryId]: productsData
      }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProductsMap(prev => ({
        ...prev,
        [subCategoryId]: []
      }));
    }
  };

  const handleCategorySelect = (category: string) => {
    
    setSelectedCategory(category);
    
    if (category === 'All categories') {
      // Call parent callback with no category ID for "All categories"
      if (onCategorySelect) {
        onCategorySelect(category);
      }
      setExpandedCategories([]);
    } else {
      // Find the category object to get the ID
      const selectedCat = categories.find(cat => cat.name === category);
      const categoryId = selectedCat?._id;
      
      console.log('Category selected with ID:', categoryId);
      
      // Call parent callback with category ID
      if (onCategorySelect) {
        onCategorySelect(category, categoryId);
      }
      
      console.log('Toggling category expansion');
      
      // Toggle expanded state
      if (expandedCategories.includes(category)) {
        console.log('Category already expanded, collapsing');
        setExpandedCategories(expandedCategories.filter(cat => cat !== category));
      } else {
        console.log('Category not expanded, expanding');
        const newExpandedCategories = [...expandedCategories, category];
        console.log('New expanded categories will be:', newExpandedCategories);
        setExpandedCategories(newExpandedCategories);
      }
    }
    
    // Force a re-render by updating the menu key
    console.log('Forcing menu re-render');
  };

  const handleSubCategorySelect = async (subCategory: string, subCategoryId: string) => {
    console.log('Selected subcategory:', subCategory);
    
    // Call parent callback
    if (onSubCategorySelect) {
      onSubCategorySelect(subCategory, subCategoryId);
    }
    
    await fetchProductsBySubCategory(subCategoryId);
  };

  const handleProductSelect = (product: string) => {
    console.log('Selected product:', product);
    // Handle product selection - can be used for showing product details
  };

  const menuItems = [
    {
      key: 'categories',
      label: 'Categories',
      type: 'group' as const,
      children: [
        {
          key: 'All categories',
          label: 'All categories',
          onClick: () => handleCategorySelect('All categories')
        },
        ...categories.map(category => {
          const categorySubCategories = subCategoriesMap[category._id] || [];
          
          return {
            key: category.name,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{category.name}</span>
              </div>
            ),
            onClick: () => handleCategorySelect(category.name),
            children: expandedCategories.includes(category.name) ? (
              categorySubCategories.length > 0 ? 
                categorySubCategories.map((subCat: SubCategory) => ({
                  key: subCat.name,
                  label: subCat.name,
                  onClick: () => handleSubCategorySelect(subCat.name, subCat._id)
                })) : 
                [{
                  key: 'no-subcategories',
                  label: 'No subcategories found',
                  disabled: true,
                  style: { color: '#999', fontStyle: 'italic' }
                }]
            ) : []
          };
        })
      ]
    }
  ];

  if (loading) {
    return (
      <div style={{ background: 'white', minHeight: '500px', borderRight: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: 'white', minHeight: '500px', borderRight: '1px solid #f0f0f0' }}>
      <Menu
        mode="inline"
        selectedKeys={[selectedCategory]}
        openKeys={expandedCategories}
        onOpenChange={(keys) => {
          console.log('Menu openKeys changed:', keys);
          setExpandedCategories(keys as string[]);
        }}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
      />
    </div>
  );
};

export default Sidebar;