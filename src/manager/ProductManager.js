const fs = require('fs/promises');
const path = require('path');
const productModel = require('../models/product.model.js');

class ProductManager {
    constructor() { }

    async getProducts() {
        try {
            return await productModel.find().lean();
        } catch (error) {
            console.error("Error al obtener productos:", error);
            return [];
        }
    }

    async getProductById(id) {
        try {
            return await productModel.findById(id).lean();
        } catch (error) {
            console.error("Error al buscar el producto por ID", error);
            return null;
        }
    }

    async addProduct(productData) {
        try {
            const newProduct = await productModel.create(productData);
            return newProduct;
        } catch (error) {
            console.error("Error al agregar producto", error);
            throw error;
        }
    }

    async updateProduct(id, datosActualizados) {
        try {
            // { new: true } hace que devuelva el producto ya modificado
            const updatedProduct = await productModel.findByIdAndUpdate(
                id,
                datosActualizados,
                { new: true }
            ).lean();
            return updatedProduct;
        } catch (error) {
            console.error("Error al actualizar:", error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const result = await productModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            console.error("Error al eliminar el producto", error);
            throw error;
        }
    }
}

module.exports = ProductManager;