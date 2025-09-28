import { Product } from "@/types/Menu";
import { Variant } from "@/types/Variants";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface OrderTakingFormProps{
    product: Product;
    setProduct: React.Dispatch<React.SetStateAction<Product|null>>;
    token: string | null;
}

const OrderTakingForm = ({product,setProduct,token}:OrderTakingFormProps) => {
    const [variants, setVariants] = useState<Variant[] | null>(null);
    const [addOnPages, setAddonPages] = useState<Variant[] | null>(null);
    const getVariantAndGroups = async () => {
                    const res = await (
                        window as any
                    ).electronAPI.getVariantsByProductId(token, product.id);
                    if (!res.status) {
                        toast.error("Unable to get product's variant");
                        return;
                    }
                    setVariants(res.data);
                    const groupRes = await (
                        window as any
                    ).electronAPI.getAddOnPagesByProductId(token, product.id);
                    if (!groupRes.status) {
                        toast.error("Unable to get product's addon pages");
                        return;
                    }
                    setAddonPages(
                        groupRes.data.map((page: any) => {
                            return {
                                id: page.id,
                                minComplements: page.minComplements,
                                maxComplements: page.maxComplements,
                                freeAddons: page.freeAddons,
                                selectedGroup: page.selectedGroup,
                                pageNo: page.pageNo,
                            };
                        })
                    );
                };
    useEffect(()=>{
        getVariantAndGroups();
    },[])
    console.log("product",product);
    console.log("variants",variants);
    console.log("addonpages",addOnPages);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-indigo-500">
                            Take Order
                        </h2>
                        <button
                            type="button"
                            onClick={() => setProduct(null)}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>
            </div>
        </div>
    )
}

export default OrderTakingForm