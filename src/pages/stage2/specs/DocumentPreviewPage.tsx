import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  FileType,
  HardDrive,
  CheckCircle,
  Layers,
  GitBranch,
  Settings,
  Database,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { solutionSpecs } from '@/data/blueprints/solutionSpecs';

interface DocumentContent {
  title: string;
  type: string;
  size: string;
  lastModified: string;
  overview: string;
  sections: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  keyPoints: string[];
  technicalSpecs?: {
    format: string;
    pages: number;
    language: string;
    compatibility: string[];
  };
}

function getDocumentContent(specTitle: string, docName: string): DocumentContent {
  const baseContent = {
    lastModified: new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
  };

  if (docName.includes('Full Specification')) {
    return {
      ...baseContent,
      title: `${specTitle} — Full Specification`,
      type: 'PDF',
      size: '2.4 MB',
      overview: 'Comprehensive architecture specification document providing detailed technical requirements, design patterns, and implementation guidance for the complete solution.',
      sections: [
        {
          title: 'Executive Summary',
          description: 'High-level overview and business value proposition',
          icon: Eye
        },
        {
          title: 'Architecture Overview',
          description: 'System architecture, components, and integration patterns',
          icon: Layers
        },
        {
          title: 'Technical Requirements',
          description: 'Detailed functional and non-functional requirements',
          icon: Settings
        },
        {
          title: 'Implementation Guide',
          description: 'Step-by-step implementation methodology and best practices',
          icon: CheckCircle
        },
        {
          title: 'Security & Compliance',
          description: 'Security frameworks, compliance requirements, and governance',
          icon: Shield
        }
      ],
      keyPoints: [
        'Complete technical specification with 50+ pages of detailed guidance',
        'Includes reference architecture diagrams and component specifications',
        'Covers security, compliance, and governance requirements',
        'Provides implementation roadmap and delivery methodology',
        'Aligned with DTMP architecture standards and best practices'
      ],
      technicalSpecs: {
        format: 'PDF (Portable Document Format)',
        pages: 52,
        language: 'English',
        compatibility: ['Adobe Reader', 'Browser PDF viewers', 'Mobile PDF apps']
      }
    };
  }

  if (docName.includes('Diagrams')) {
    return {
      ...baseContent,
      title: `${specTitle} Diagrams`,
      type: 'ZIP',
      size: '8.1 MB',
      overview: 'Complete collection of architecture diagrams including logical, integration, and deployment views in multiple formats for design and presentation use.',
      sections: [
        {
          title: 'Context Diagrams',
          description: 'High-level system context and external interfaces',
          icon: Eye
        },
        {
          title: 'Container Diagrams',
          description: 'Application and service container architecture',
          icon: Database
        },
        {
          title: 'Component Diagrams',
          description: 'Detailed component relationships and dependencies',
          icon: GitBranch
        },
        {
          title: 'Deployment Diagrams',
          description: 'Infrastructure and deployment topology views',
          icon: HardDrive
        }
      ],
      keyPoints: [
        'High-resolution diagrams in PNG, SVG, and Visio formats',
        'Editable source files for customization and adaptation',
        'Consistent with C4 model architecture documentation standards',
        'Includes both logical and physical architecture views',
        'Ready for presentation and stakeholder communication'
      ],
      technicalSpecs: {
        format: 'ZIP Archive',
        pages: 0,
        language: 'Visual/Diagrams',
        compatibility: ['Visio', 'Draw.io', 'Lucidchart', 'Standard image viewers']
      }
    };
  }

  if (docName.includes('Components')) {
    return {
      ...baseContent,
      title: `${specTitle} Components`,
      type: 'PDF',
      size: '1.2 MB',
      overview: 'Detailed component reference guide with interface definitions, data models, and integration specifications for all solution components.',
      sections: [
        {
          title: 'Component Catalog',
          description: 'Complete inventory of all solution components',
          icon: GitBranch
        },
        {
          title: 'Interface Specifications',
          description: 'API definitions, data contracts, and integration points',
          icon: Settings
        },
        {
          title: 'Data Models',
          description: 'Entity relationships and data structure definitions',
          icon: Database
        },
        {
          title: 'Configuration Guide',
          description: 'Component configuration and deployment parameters',
          icon: FileType
        }
      ],
      keyPoints: [
        'Comprehensive component catalog with technical specifications',
        'API documentation with request/response examples',
        'Data model definitions and entity relationships',
        'Configuration templates and deployment guidelines',
        'Integration patterns and best practices'
      ],
      technicalSpecs: {
        format: 'PDF (Portable Document Format)',
        pages: 28,
        language: 'English',
        compatibility: ['Adobe Reader', 'Browser PDF viewers', 'Mobile PDF apps']
      }
    };
  }

  // Default/Roadmap document
  return {
    ...baseContent,
    title: `${specTitle} Roadmap`,
    type: 'PDF',
    size: '0.4 MB',
    overview: 'Implementation sequencing guide with dependencies, milestones, and delivery phases for successful solution deployment.',
    sections: [
      {
        title: 'Implementation Phases',
        description: 'Structured delivery phases with clear milestones',
        icon: Calendar
      },
      {
        title: 'Dependencies & Risks',
        description: 'Critical path analysis and risk mitigation strategies',
        icon: Shield
      },
      {
        title: 'Resource Planning',
        description: 'Team structure and skill requirements by phase',
        icon: Settings
      },
      {
        title: 'Success Criteria',
        description: 'Measurable outcomes and acceptance criteria',
        icon: CheckCircle
      }
    ],
    keyPoints: [
      'Phased implementation approach with clear deliverables',
      'Risk assessment and mitigation strategies',
      'Resource allocation and team structure guidance',
      'Success metrics and acceptance criteria',
      'Timeline estimates and critical path analysis'
    ],
    technicalSpecs: {
      format: 'PDF (Portable Document Format)',
      pages: 12,
      language: 'English',
      compatibility: ['Adobe Reader', 'Browser PDF viewers', 'Mobile PDF apps']
    }
  };
}

function simulateDownload(fileName: string, fileType: string) {
  // Create a simple text content for demonstration
  const content = `This is a simulated download of ${fileName}.\n\nDocument Type: ${fileType}\nGenerated: ${new Date().toLocaleString()}\n\nThis would normally contain the actual document content.`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.${fileType.toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DocumentPreviewPage() {
  const { specId, docName } = useParams<{ specId: string; docName: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const spec = solutionSpecs.find(s => s.id === specId);
  const decodedDocName = docName ? decodeURIComponent(docName) : '';
  
  if (!spec || !decodedDocName) {
    return (
      <div className="stage2-content p-6">
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-500 mb-6">The requested document could not be found.</p>
          <Button onClick={() => navigate('/stage2/specs/acquired-specs')}>
            Back to Acquired Specs
          </Button>
        </div>
      </div>
    );
  }

  const docContent = getDocumentContent(spec.title, decodedDocName);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    simulateDownload(docContent.title, docContent.type);
    setIsDownloading(false);
  };

  return (
    <div className="stage2-content p-6">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(`/stage2/specs/acquired-specs`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Acquired Specs
      </button>

      {/* Document Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {spec.solutionType}
              </Badge>
              <Badge variant="secondary">
                {docContent.type}
              </Badge>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{docContent.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <FileType className="w-4 h-4" />
                {docContent.size}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated {docContent.lastModified}
              </span>
              {docContent.technicalSpecs && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {docContent.technicalSpecs.pages > 0 ? `${docContent.technicalSpecs.pages} pages` : 'Multiple files'}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed">{docContent.overview}</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </div>

      {/* Document Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Sections</h2>
          <div className="space-y-3">
            {docContent.sections.map((section, idx) => {
              const IconComponent = section.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{section.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Highlights</h2>
          <ul className="space-y-2">
            {docContent.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technical Specifications */}
      {docContent.technicalSpecs && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Format</h3>
              <p className="text-sm text-gray-900">{docContent.technicalSpecs.format}</p>
            </div>
            {docContent.technicalSpecs.pages > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Pages</h3>
                <p className="text-sm text-gray-900">{docContent.technicalSpecs.pages}</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Language</h3>
              <p className="text-sm text-gray-900">{docContent.technicalSpecs.language}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Compatibility</h3>
              <p className="text-sm text-gray-900">{docContent.technicalSpecs.compatibility.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}