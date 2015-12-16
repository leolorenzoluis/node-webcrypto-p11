import * as graphene from "graphene-pk11"
import * as iwc from "./iwebcrypto"
import * as key from "./key"

export interface IAlgorithmBase{
	generateKey(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKey | iwc.ICryptoKeyPair;
	sign(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, data: Buffer);
	verify(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, signature: Buffer, data: Buffer): boolean;
	encrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, data: Buffer): Buffer;
	decrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, data: Buffer): Buffer;
}

export class AlgorithmBase{
	static generateKey(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKey | iwc.ICryptoKeyPair {
		throw new Error("Method is not supported");
	}
	
	static sign(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: iwc.ICryptoKey, data: Buffer) {
		throw new Error("Method is not supported");
	}
	
	static verify(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: iwc.ICryptoKey, signature: Buffer, data: Buffer): boolean{
		throw new Error("Method is not supported");
	}
	
	static encrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, data: Buffer): Buffer{
		throw new Error("Method is not supported");
	}
	
	static decrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: key.CryptoKey, data: Buffer): Buffer{
		throw new Error("Method is not supported");
	}

	static checkAlgorithmIdentifier(alg) {
		if (typeof alg !== "object")
			throw TypeError("AlgorithmIdentifier: Algorithm must be an Object");
		if (!(alg.name && typeof (alg.name) == "string"))
			throw TypeError("AlgorithmIdentifier: Missing required property name");
	}
	static checkAlgorithmHashedParams(alg) {
		if (!alg.hash)
			throw new TypeError("AlgorithmHashedParams: Missing required property hash");
		this.checkAlgorithmIdentifier(alg.hash);
	}
	
	static checkKey(key: iwc.ICryptoKey, type: string){
		if (!key)
			throw new TypeError("CryptoKey: Key can not be null");
		if (key.type !== type)
			throw new TypeError(`CryptoKey: Wrong key type in use. Must be '${type}'`);
	}
	
	static checkPrivateKey(key: iwc.ICryptoKey){
		this.checkKey(key, "private");
	}
	
	static checkPublicKey(key: iwc.ICryptoKey){
		this.checkKey(key, "public");
	}
	
	static checkSecretKey(key: iwc.ICryptoKey){
		this.checkKey(key, "secret");
	}
} 