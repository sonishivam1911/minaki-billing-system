import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import { formatRupees } from '../utils';

/**
 * ProductCard Component
 * Displays a single product with details and add to cart button
 * 
 * @param {Object} props
 * @param {Object} props.product - Product data
 * @param {Function} props.onAddToCart - Callback when add to cart is clicked
 */
export const ProductCard = ({ product, onAddToCart }) => {
  const {
    id,
    item_id,
    name,
    category,
    price,
    rate,
    stock,
    stock_on_hand,
    weight,
    net_weight,
    purity,
    purity_k,
    image = '💎',
    brand,
    isDemistified = false,
    sku,
    diamond_components = [],
    metal_components = [],
  } = product;

  // Use the correct price and stock fields based on product type
  const finalPrice = isDemistified ? (rate || price || 0) : (price || rate || 0);
  const finalStock = isDemistified ? (stock_on_hand || stock || 0) : (stock || stock_on_hand || 0);
  // For demistified products, use item_id instead of sku
  const productIdentifier = isDemistified ? (item_id || id || sku) : id;
  const productType = isDemistified ? 'demistified' : 'real';

  const isOutOfStock = finalStock === 0;
  const isLowStock = finalStock < 3 && finalStock > 0;

  // Handle image display - check if it's a URL or emoji
  const isImageUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'));

  // Extract purity and net weight from metal components for real jewellery
  const getGoldInfo = () => {
    if (isDemistified || !metal_components || metal_components.length === 0) {
      return null;
    }

    // Get the first/main metal component
    const mainMetal = metal_components[0];
    if (!mainMetal) return null;

    return {
      purity: mainMetal.purity_k ? `${mainMetal.purity_k}K` : null,
      netWeight: mainMetal.net_weight_g || mainMetal.net_weight || null,
      grossWeight: mainMetal.weight_g || mainMetal.weight || null,
    };
  };

  const goldInfo = getGoldInfo();

  // Extract 4 C's of diamonds for real jewellery products
  const getDiamondFourCs = () => {
    if (isDemistified || !diamond_components || diamond_components.length === 0) {
      return null;
    }

    // Get the first/main diamond component
    const mainDiamond = diamond_components[0];
    if (!mainDiamond) return null;

    // Helper to round carat to 2 decimals
    const roundCarat = (value) => {
      if (!value) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return null;
      return parseFloat(num.toFixed(2));
    };

    const fourCs = {
      carat: mainDiamond.carat_weight ? `${roundCarat(mainDiamond.carat_weight)}ct` : null,
      cut: mainDiamond.cut || mainDiamond.shape || null,
      color: mainDiamond.color || mainDiamond.color_grade || mainDiamond.diamond_color || null,
      clarity: mainDiamond.clarity || mainDiamond.clarity_grade || mainDiamond.diamond_clarity || null,
    };

    // Return only non-null values
    return Object.values(fourCs).some(val => val !== null) ? fourCs : null;
  };

  const diamondFourCs = getDiamondFourCs();

  // Helper function to round to 2 decimal places
  const roundToTwoDecimals = (value) => {
    if (value === null || value === undefined) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return parseFloat(num.toFixed(2));
  };

  // Determine final purity and net weight to display
  const displayPurity = goldInfo?.purity || purity || (purity_k ? `${purity_k}K` : null);
  const displayNetWeight = roundToTwoDecimals(goldInfo?.netWeight || net_weight);
  const displayGrossWeight = roundToTwoDecimals(goldInfo?.grossWeight || weight);

  // Create product detail link
  const productDetailLink = `/product/${productType}/${encodeURIComponent(productIdentifier)}`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <MuiLink component={Link} to={productDetailLink} sx={{ textDecoration: 'none' }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {isImageUrl ? (
            <CardMedia
              component="img"
              height="200"
              image={image}
              alt={name}
              sx={{
                objectFit: 'cover',
                '&:hover': {
                  opacity: 0.9,
                },
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                backgroundColor: '#f5f1e8',
              }}
            >
              {image}
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 1,
              },
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Eye size={20} />
              <Typography variant="body2">View Details</Typography>
            </Box>
          </Box>
        </Box>
      </MuiLink>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {category && (
          <Typography variant="caption" sx={{ color: '#8b6f47', mb: 0.5 }}>
            {category}
          </Typography>
        )}
        
        <MuiLink component={Link} to={productDetailLink} sx={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#2c2416', '&:hover': { color: '#8b6f47' } }}>
            {name}
          </Typography>
        </MuiLink>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {brand && isDemistified && (
            <Chip label={brand} size="small" sx={{ backgroundColor: '#f5f1e8', color: '#5d4e37' }} />
          )}
          {/* Display Purity prominently for all products */}
          {displayPurity && (
            <Chip 
              label={`Purity: ${displayPurity}`} 
              size="small" 
              sx={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }} 
            />
          )}
          {/* Display Net Weight for all products */}
          {displayNetWeight && (
            <Chip 
              label={`Net Wt: ${displayNetWeight}g`} 
              size="small" 
              sx={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }} 
            />
          )}
          {/* Display 4 C's of diamonds for real jewellery */}
          {diamondFourCs && !isDemistified && (
            <>
              {diamondFourCs.carat && (
                <Chip 
                  label={`Carat: ${diamondFourCs.carat}`} 
                  size="small" 
                  sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 500 }} 
                />
              )}
              {diamondFourCs.cut && (
                <Chip 
                  label={`Cut: ${diamondFourCs.cut}`} 
                  size="small" 
                  sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 500 }} 
                />
              )}
              {diamondFourCs.color && (
                <Chip 
                  label={`Color: ${diamondFourCs.color}`} 
                  size="small" 
                  sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 500 }} 
                />
              )}
              {diamondFourCs.clarity && (
                <Chip 
                  label={`Clarity: ${diamondFourCs.clarity}`} 
                  size="small" 
                  sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 500 }} 
                />
              )}
            </>
          )}
          <Chip
            label={`${finalStock} in stock`}
            size="small"
            color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'default'}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
          {formatRupees(finalPrice)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            to={productDetailLink}
            size="small"
            variant="outlined"
            startIcon={<Eye size={14} />}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};
