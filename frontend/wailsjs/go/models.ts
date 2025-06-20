export namespace backend {
	
	export class DuplicateResult {
	    importRecord: Record<string, any>;
	    existingRecords: any[];
	    duplicateFields: string[];
	    confidence: number;
	
	    static createFrom(source: any = {}) {
	        return new DuplicateResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.importRecord = source["importRecord"];
	        this.existingRecords = source["existingRecords"];
	        this.duplicateFields = source["duplicateFields"];
	        this.confidence = source["confidence"];
	    }
	}

}

export namespace database {
	
	export class FieldDefinition {
	    key: string;
	    type: string;
	    displayName: string;
	    description?: string;
	    unit?: string;
	    isSearchable?: boolean;
	    isOptional?: boolean;
	    isUnique?: boolean;
	    relatedDataset?: string;
	    relatedField?: string;
	    isRelation?: boolean;
	    preventDeleteIfReferenced?: boolean;
	    cascadeDeleteIfReferenced?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FieldDefinition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.type = source["type"];
	        this.displayName = source["displayName"];
	        this.description = source["description"];
	        this.unit = source["unit"];
	        this.isSearchable = source["isSearchable"];
	        this.isOptional = source["isOptional"];
	        this.isUnique = source["isUnique"];
	        this.relatedDataset = source["relatedDataset"];
	        this.relatedField = source["relatedField"];
	        this.isRelation = source["isRelation"];
	        this.preventDeleteIfReferenced = source["preventDeleteIfReferenced"];
	        this.cascadeDeleteIfReferenced = source["cascadeDeleteIfReferenced"];
	    }
	}
	export class Dataset {
	    id: string;
	    name: string;
	    description?: string;
	    type: string;
	    fields: FieldDefinition[];
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    lastModified: any;
	
	    static createFrom(source: any = {}) {
	        return new Dataset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.type = source["type"];
	        this.fields = this.convertValues(source["fields"], FieldDefinition);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.lastModified = this.convertValues(source["lastModified"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

