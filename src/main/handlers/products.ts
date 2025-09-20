import { IpcMainInvokeEvent } from "electron";
import { ProductsDatabaseOperations } from "../database/productsOperations.js";
import Logger from "electron-log";

export const createProduct = async (event: IpcMainInvokeEvent,token:string, productData: any, variantPrices: any, addonPages: any) => {
    try {
            const result = await ProductsDatabaseOperations.createProduct(productData, variantPrices, addonPages);
            return {
                status:true,
                data:result
            }
        } catch (error) {
            Logger.error("Error saving order:", error);
            return {
                status:false,
                error:(error as Error).message
            }
        }
};