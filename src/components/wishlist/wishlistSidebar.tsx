import React, { useState, useEffect } from 'react';
import { Button, List, Spin, Empty, message } from 'antd';
import { CloseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { wishlistAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  _id: string;
  userId: string;
  productId?: {
    _id: string;
    name: string;
    description: string;
    subCategoryId: string;
    variants: Array<{ ram: string; price: number; quantity: number; _id: string }>;
    images: string[];
    createdAt: string;
    updatedAt: string;
  };
  product?: {
    _id: string;
    name: string;
    description: string;
    subCategoryId: string;
    variants: Array<{ ram: string; price: number; quantity: number; _id: string }>;
    images: string[];
    createdAt: string;
    updatedAt: string;
  };
}

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WishlistSidebar: React.FC<WishlistSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wishlist items when sidebar opens
  useEffect(() => {
    if (isOpen && user?.id) {
      console.log('WishlistSidebar: Opening sidebar for user:', user.id);
      fetchWishlistItems();
    } else if (isOpen && !user?.id) {
      console.log('WishlistSidebar: User not authenticated');
      setError('Please login to view your wishlist');
    }
  }, [isOpen, user]);

  const fetchWishlistItems = async () => {
    if (!user?.id) {
      console.log('WishlistSidebar: No user ID available');
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('WishlistSidebar: Fetching wishlist for user:', user.id);
      
      const response = await wishlistAPI.getWishlistByUser(user.id);
      console.log('WishlistSidebar: API response:', response);
      
      // Handle different possible response structures
      let wishlistData = [];
      
      try {
        if (response && typeof response === 'object') {
          if (response.data && Array.isArray(response.data)) {
            wishlistData = response.data;
          } else if (response.wishlist && Array.isArray(response.wishlist)) {
            wishlistData = response.wishlist;
          } else if (Array.isArray(response)) {
            wishlistData = response;
          } else {
            console.log('WishlistSidebar: Response is object but no valid array found');
            wishlistData = [];
          }
        } else {
          console.log('WishlistSidebar: Response is not an object');
          wishlistData = [];
        }
      } catch (parseError) {
        console.error('WishlistSidebar: Error parsing response:', parseError);
        wishlistData = [];
      }
      
      console.log('WishlistSidebar: Processed wishlist data:', wishlistData);
      
      // Transform and validate each wishlist item
      const validWishlistItems = wishlistData.filter((item: any) => {
        if (!item || typeof item !== 'object') {
          console.log('WishlistSidebar: Invalid item found:', item);
          return false;
        }
        
        // Check if product data is in productId field (API structure)
        if (item.productId && typeof item.productId === 'object') {
          // Transform the structure to match component expectations
          item.product = item.productId;
          delete item.productId;
        }
        
        if (!item.product || typeof item.product !== 'object') {
          console.log('WishlistSidebar: Item missing product:', item);
          return false;
        }
        
        if (!item.product._id || !item.product.name) {
          console.log('WishlistSidebar: Product missing required fields:', item.product);
          return false;
        }
        
        return true;
      });
      
      console.log('WishlistSidebar: Valid wishlist items:', validWishlistItems.length);
      setWishlistItems(validWishlistItems);
      
    } catch (error: any) {
      console.error('WishlistSidebar: Failed to fetch wishlist:', error);
      console.error('WishlistSidebar: Error details:', error.response?.data || error.message);
      setError('Failed to load wishlist');
      message.error('Failed to load wishlist');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user?.id) return;
    
    try {
      await wishlistAPI.removeFromWishlist(user.id, productId);
      message.success('Removed from wishlist');
      // Refresh wishlist items
      fetchWishlistItems();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      message.error('Failed to remove from wishlist');
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    onClose();
  };

  const getProductImage = (item: WishlistItem) => {
    try {
      const product = item.product || item.productId;
      if (!product) {
        return 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
      }
      
      // Check if product has images array
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (firstImage && 
            !firstImage.includes('example.com') && 
            !firstImage.includes('placeholder') &&
            !firstImage.startsWith('blob:')) {
          return firstImage;
        }
      }
      
      // Return placeholder
      return 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
    } catch (error) {
      console.error('WishlistSidebar: Error getting product image:', error);
      return 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
    }
  };

  const getProductPrice = (item: WishlistItem) => {
    try {
      const product = item.product || item.productId;
      if (!product || !product.variants || product.variants.length === 0) {
        return 0;
      }
      
      // Return the price of the first variant
      return product.variants[0].price || 0;
    } catch (error) {
      console.error('WishlistSidebar: Error getting product price:', error);
      return 0;
    }
  };

  console.log('WishlistSidebar: Rendering with props:', { isOpen, user: user?.id, loading, error, wishlistItemsCount: wishlistItems.length });

  try {
    return (
      <>
        <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
        <div className={`sidebar-cart ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Wishlist</h3>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <p>{error}</p>
            </div>
          ) : wishlistItems.length > 0 ? (
            <List
              dataSource={wishlistItems}
                              renderItem={(item) => {
                  try {
                    // Validate item before rendering
                    const product = item.product || item.productId;
                    if (!item || !product || !product._id || !product.name) {
                      console.log('WishlistSidebar: Skipping invalid item:', item);
                      return null;
                    }
                    
                    return (
                      <List.Item key={item._id || product._id}>
                        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={getProductImage(item)} 
                            alt={product.name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{product.name}</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>
                              ${getProductPrice(item)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleViewProduct(product._id)}
                                style={{ padding: '0', height: 'auto' }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFromWishlist(product._id)}
                          />
                        </div>
                      </List.Item>
                    );
                  } catch (renderError) {
                    console.error('WishlistSidebar: Error rendering item:', renderError, item);
                    return null;
                  }
                }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <Empty description="Your wishlist is empty" />
            </div>
          )}
          
          {wishlistItems.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '16px' }}>
                <span>Total Items: {wishlistItems.length}</span>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </>
  );
  } catch (error) {
    console.error('WishlistSidebar: Error rendering component:', error);
    return (
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
        <div className={`sidebar-cart ${isOpen ? 'open' : ''}`}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Wishlist</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            </div>
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <p>Error loading wishlist. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default WishlistSidebar;