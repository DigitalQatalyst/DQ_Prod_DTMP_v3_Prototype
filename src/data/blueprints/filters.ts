export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'range';
  options?: FilterOption[];
  defaultValue?: string | number | boolean | string[];
}

export const solutionSpecsFilters: FilterConfig[] = [
  {
    key: 'scope',
    label: 'Scope',
    type: 'checkbox',
    options: [
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'departmental', label: 'Departmental' },
      { value: 'project', label: 'Project' }
    ]
  },
  {
    key: 'maturityLevel',
    label: 'Maturity Level',
    type: 'checkbox',
    options: [
      { value: 'conceptual', label: 'Conceptual' },
      { value: 'proven', label: 'Proven' },
      { value: 'reference', label: 'Reference' }
    ]
  },

  {
    key: 'complexity',
    label: 'Complexity',
    type: 'checkbox',
    options: [
      { value: 'simple', label: 'Simple (≤ 10 components)' },
      { value: 'moderate', label: 'Moderate (11–20 components)' },
      { value: 'complex', label: 'Complex (21–35 components)' },
      { value: 'expert', label: 'Expert (36+ components)' }
    ]
  },
  {
    key: 'technologyStack',
    label: 'Technology Stack',
    type: 'checkbox',
    options: [
      { value: 'Cloud-Native', label: 'Cloud Native' },
      { value: 'Multi-Cloud', label: 'Multi-Cloud' },
      { value: 'Hybrid', label: 'Hybrid' },
      { value: 'Kubernetes', label: 'Kubernetes' },
      { value: 'Microservices', label: 'Microservices' },
      { value: 'API Gateway', label: 'API Gateway' },
      { value: 'Kafka', label: 'Kafka / Event Streaming' },
      { value: 'Data Lake', label: 'Data Lake' },
      { value: 'MLOps', label: 'AI / ML (MLOps)' },
      { value: 'Microsoft 365', label: 'Microsoft 365' }
    ]
  }
];

export const solutionSpecsFiltersKC: Record<string, string[]> = {
  scope: ['Enterprise', 'Departmental', 'Project'],
  maturityLevel: ['Conceptual', 'Proven', 'Reference'],
  complexity: ['Simple', 'Moderate', 'Complex', 'Expert'],
  technologyStack: [
    'Cloud-Native', 'Multi-Cloud', 'Hybrid', 'Kubernetes',
    'Microservices', 'API Gateway', 'Kafka', 'Data Lake',
    'MLOps', 'Microsoft 365',
  ],
};

export const solutionBuildFilters: FilterConfig[] = [
  {
    key: 'buildComplexity',
    label: 'Build Complexity',
    type: 'checkbox',
    options: [
      { value: 'basic', label: 'Basic' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' }
    ]
  },
  {
    key: 'automationLevel',
    label: 'Automation Level',
    type: 'checkbox',
    options: [
      { value: 'manual', label: 'Manual' },
      { value: 'semi-automated', label: 'Semi-Automated' },
      { value: 'fully-automated', label: 'Fully Automated' }
    ]
  },
  {
    key: 'hasCodeSamples',
    label: 'Has Code Samples',
    type: 'checkbox',
    options: [{ value: 'true', label: 'Yes' }]
  }
];
