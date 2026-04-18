import { Schema, model } from "mongoose";

export interface IPackage {
    trackingNumber: string;
    senderName: string;
    recipientName: string;
    weight: number;
    dimension: {
        length: number;
        width: number;
        height: number
    };
    status: "registered" | "in_transit" | "delivered";
}