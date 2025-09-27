import { fetchCategories, fetchProductsByCatId, fetchSubcategories } from '@/renderer/utils/menu'
import { Category, SubCategory } from '@/types/categories'
import React, { useEffect, useState } from 'react'
import CustomButton from '../ui/CustomButton'
import { Product } from '@/types/Menu'

const OrderMenu = ({ token }: { token: string | null }) => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(null);
  const [products,setProducts]=useState<Product[]| null>(null);
  useEffect(() => {
    fetchCategories(token, setCategories);
  }, [])
  const handleSelectCategory=(category:Category)=>{
    fetchSubcategories(category.id,token,setSubCategories);
  }
  const handleSelectSubCategory=(subcat:SubCategory)=>{
    fetchProductsByCatId(token,subcat.id,setProducts);
  }
  return (
    <div>
        <div className='flex items-center gap-4 mb-4 flex-wrap'>{categories && categories.map(category => {
            return <CustomButton key={category.id} type='button' label={category.categoryName} onClick={()=>handleSelectCategory(category)} className={`bg-${category.color}-500 hover:bg-${category.color}-600 border-${category.color}-900`}/>
          })
        }
        </div>
        <div className='flex items-center gap-4 mb-4 flex-wrap'>{
          subCategories && subCategories.map(subcat=>{
            return <CustomButton key={subcat.id} type='button' label={subcat.name} className={`bg-${subcat.color}-500 hover:bg-${subcat.color}-600 border-${subcat.color}-900`} onClick={()=>handleSelectSubCategory(subcat)}/>
          })
          }
        </div>
        <div className='flex items-center gap-4 mb-4 flex-wrap'>{
          products && products.map(p=>{
            return <CustomButton key={p.id} type='button' label={p.name} className={`bg-${p.color}-600 hover:bg-${p.color}-700 border-${p.color}-900`} onClick={()=>{}}/>
          })
          }
        </div>
      </div>
  )
}

export default OrderMenu