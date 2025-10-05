import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Node, 
  Step, 
  StandardProperties, 
  StandardProperty,
  Workflow,
  SearchResult, 
  ApiResponse 
} from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:5200/api';

  constructor(private http: HttpClient) {}

  // Health Check
  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // Nodes
  getNodes(): Observable<ApiResponse<Node[]>> {
    return this.http.get<ApiResponse<Node[]>>(`${this.baseUrl}/nodes`);
  }

  getNode(id: string): Observable<ApiResponse<Node>> {
    return this.http.get<ApiResponse<Node>>(`${this.baseUrl}/nodes/${id}`);
  }

  createNode(node: Partial<Node>): Observable<ApiResponse<Node>> {
    return this.http.post<ApiResponse<Node>>(`${this.baseUrl}/nodes`, node);
  }

  updateNode(id: string, node: Partial<Node>): Observable<ApiResponse<Node>> {
    return this.http.put<ApiResponse<Node>>(`${this.baseUrl}/nodes/${id}`, node);
  }

  deleteNode(id: string, options?: { force?: boolean; cascade?: boolean }): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (options?.force !== undefined) {
      params = params.set('force', options.force.toString());
    }
    if (options?.cascade !== undefined) {
      params = params.set('cascade', options.cascade.toString());
    }
    
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/nodes/${id}`, { params });
  }

  getNodeDependencies(id: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/nodes/${id}/dependencies`);
  }

  getNodeDeletionInfo(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/nodes/${id}/deletion-info`);
  }

  // Steps
  addStepToNode(nodeId: string, step: Partial<Step>): Observable<ApiResponse<Step>> {
    return this.http.post<ApiResponse<Step>>(`${this.baseUrl}/nodes/${nodeId}/steps`, step);
  }

  updateStepInNode(nodeId: string, stepId: string, step: Partial<Step>): Observable<ApiResponse<Step>> {
    return this.http.put<ApiResponse<Step>>(`${this.baseUrl}/nodes/${nodeId}/steps/${stepId}`, step);
  }

  deleteStepFromNode(nodeId: string, stepId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/nodes/${nodeId}/steps/${stepId}`);
  }

  // Search
  search(query: string, options?: { workflow?: string; type?: string; includeProperties?: boolean; standardProperty?: string; propertyValue?: string }): Observable<ApiResponse<SearchResult[]>> {
    let params = new HttpParams().set('q', query);
    if (options?.workflow) {
      params = params.set('workflow', options.workflow);
    }
    if (options?.type) {
      params = params.set('type', options.type);
    }
    if (options?.includeProperties !== undefined) {
      params = params.set('includeProperties', options.includeProperties.toString());
    }
    if (options?.standardProperty) {
      params = params.set('standardProperty', options.standardProperty);
    }
    if (options?.propertyValue) {
      params = params.set('propertyValue', options.propertyValue);
    }
    return this.http.get<ApiResponse<SearchResult[]>>(`${this.baseUrl}/search`, { params });
  }

  searchNodes(query: string, workflow?: string): Observable<ApiResponse<Node[]>> {
    let params = new HttpParams().set('q', query);
    if (workflow) {
      params = params.set('workflow', workflow);
    }
    return this.http.get<ApiResponse<Node[]>>(`${this.baseUrl}/search`, { params });
  }

  // Search utilities
  getAvailableWorkflows(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/search/workflows`);
  }

  getAvailableStepTypes(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/search/types`);
  }

  getSearchSuggestions(query: string): Observable<ApiResponse<string[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/search/suggestions`, { params });
  }

  // Node connections
  getNodeConnections(nodeId: string, maxDepth: number = 10): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('maxDepth', maxDepth.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/nodes/${nodeId}/connections`, { params });
  }

  // Properties (Legacy)
  getLegacyStandardProperties(): Observable<ApiResponse<StandardProperties>> {
    return this.http.get<ApiResponse<StandardProperties>>(`${this.baseUrl}/properties/standard`);
  }

  updateLegacyStandardProperties(properties: StandardProperties): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/properties/standard`, properties);
  }

  // Workflows
  getWorkflows(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/workflows`);
  }

  getWorkflow(id: string): Observable<ApiResponse<Workflow>> {
    return this.http.get<ApiResponse<Workflow>>(`${this.baseUrl}/workflows/${id}`);
  }

  createWorkflow(workflow: Partial<Workflow>): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>(`${this.baseUrl}/workflows`, workflow);
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<ApiResponse<Workflow>> {
    return this.http.put<ApiResponse<Workflow>>(`${this.baseUrl}/workflows/${id}`, workflow);
  }

  deleteWorkflow(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/workflows/${id}`);
  }

  getWorkflowUsage(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/workflows/${id}/usage`);
  }

  // Standard Properties
  getStandardProperties(): Observable<ApiResponse<StandardProperty[]>> {
    return this.http.get<ApiResponse<StandardProperty[]>>(`${this.baseUrl}/standard-properties`);
  }

  getStandardProperty(id: string): Observable<ApiResponse<StandardProperty>> {
    return this.http.get<ApiResponse<StandardProperty>>(`${this.baseUrl}/standard-properties/${id}`);
  }

  createStandardProperty(property: Partial<StandardProperty>): Observable<ApiResponse<StandardProperty>> {
    return this.http.post<ApiResponse<StandardProperty>>(`${this.baseUrl}/standard-properties`, property);
  }

  updateStandardProperty(id: string, property: Partial<StandardProperty>): Observable<ApiResponse<StandardProperty>> {
    return this.http.put<ApiResponse<StandardProperty>>(`${this.baseUrl}/standard-properties/${id}`, property);
  }

  deleteStandardProperty(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/standard-properties/${id}`);
  }

  getStandardPropertyUsage(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/standard-properties/${id}/usage`);
  }
}
