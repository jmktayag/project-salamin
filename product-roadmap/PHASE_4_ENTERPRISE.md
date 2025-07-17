# Phase 4: Enterprise & Mobile Platform (Weeks 13-16)

**Objective**: Launch enterprise B2B platform and mobile applications to capture high-value markets and complete platform ecosystem  
**Timeline**: 4 weeks  
**Team Size**: 20 people  
**Budget**: $400,000  

---

## Overview

Phase 4 completes the Salamin platform transformation by adding enterprise B2B capabilities and native mobile applications. This phase targets high-value corporate customers while expanding accessibility through mobile platforms, establishing sustainable high-revenue streams and comprehensive market coverage.

### Success Metrics
- **Enterprise Customers**: 5+ enterprise clients with $500,000+ ARR
- **Mobile Adoption**: 100,000+ mobile app downloads
- **Platform Revenue**: $2M+ annual recurring revenue
- **Enterprise Retention**: 95%+ enterprise customer satisfaction
- **Mobile Engagement**: 70%+ mobile daily active user rate

---

## Feature 1: Enterprise Platform & B2B Features

### 1.1 Corporate Administration Dashboard

#### Enterprise Management System
```typescript
// Enterprise platform types
interface EnterpriseAccount {
  enterpriseId: string;
  companyInfo: CompanyInformation;
  subscription: EnterpriseSubscription;
  administrators: Administrator[];
  users: EnterpriseUser[];
  customization: EnterpriseBranding;
  integrations: EnterpriseIntegration[];
  analytics: EnterpriseAnalytics;
  compliance: ComplianceSettings;
  supportTier: 'standard' | 'premium' | 'dedicated';
  status: 'trial' | 'active' | 'suspended' | 'expired';
  createdAt: Timestamp;
  renewalDate: Timestamp;
}

interface CompanyInformation {
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  headquarters: Location;
  billingAddress: Address;
  taxId?: string;
  website?: string;
  description?: string;
}

interface EnterpriseSubscription {
  plan: 'team' | 'business' | 'enterprise' | 'custom';
  userLimit: number;
  currentUsers: number;
  features: string[];
  pricing: {
    monthly: number;
    annual: number;
    perUser: boolean;
    currency: string;
  };
  billingCycle: 'monthly' | 'annual';
  nextBilling: Timestamp;
  paymentMethod: PaymentMethod;
  invoiceHistory: Invoice[];
}

interface Administrator {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  permissions: AdminPermission[];
  lastLogin: Timestamp;
  status: 'active' | 'inactive' | 'pending';
}

interface EnterpriseUser {
  userId: string;
  email: string;
  department: string;
  position: string;
  manager?: string;
  hireDate?: Timestamp;
  permissions: UserPermission[];
  usageStats: UserUsageStats;
  groups: string[];
  status: 'active' | 'inactive' | 'invited';
  lastActivity: Timestamp;
}

interface EnterpriseBranding {
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  emailTemplates: CustomEmailTemplate[];
  loginPage: CustomLoginPage;
  whiteLabel: boolean;
}

interface EnterpriseIntegration {
  type: 'sso' | 'ldap' | 'hr_system' | 'lms' | 'ats' | 'api';
  provider: string;
  configuration: IntegrationConfig;
  status: 'active' | 'inactive' | 'error';
  lastSync: Timestamp;
  syncErrors?: string[];
}

interface EnterpriseAnalytics {
  userEngagement: UserEngagementMetrics;
  skillDevelopment: SkillDevelopmentMetrics;
  departmentPerformance: DepartmentMetrics[];
  roiAnalysis: ROIMetrics;
  customReports: CustomReport[];
  exportSchedule: ReportSchedule[];
}

// EnterpriseService.ts
export class EnterpriseService {
  private db = getFirestore();
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2022-11-15'
    });
  }
  
  async createEnterpriseAccount(accountData: Partial<EnterpriseAccount>, adminEmail: string): Promise<string> {
    const enterpriseRef = doc(collection(this.db, 'enterpriseAccounts'));
    
    const enterprise: EnterpriseAccount = {
      enterpriseId: enterpriseRef.id,
      companyInfo: {
        name: accountData.companyInfo?.name || '',
        domain: accountData.companyInfo?.domain || '',
        industry: accountData.companyInfo?.industry || '',
        size: accountData.companyInfo?.size || 'medium',
        headquarters: accountData.companyInfo?.headquarters || { city: '', country: '' },
        billingAddress: accountData.companyInfo?.billingAddress || this.getDefaultAddress()
      },
      subscription: {
        plan: 'team',
        userLimit: 50,
        currentUsers: 0,
        features: ['basic_analytics', 'user_management', 'bulk_invites'],
        pricing: { monthly: 2500, annual: 25000, perUser: false, currency: 'USD' },
        billingCycle: 'monthly',
        nextBilling: this.calculateNextBilling('monthly'),
        paymentMethod: {} as PaymentMethod,
        invoiceHistory: []
      },
      administrators: [{
        userId: this.generateAdminId(),
        email: adminEmail,
        role: 'super_admin',
        permissions: this.getAllAdminPermissions(),
        lastLogin: serverTimestamp(),
        status: 'pending'
      }],
      users: [],
      customization: this.getDefaultBranding(),
      integrations: [],
      analytics: this.getDefaultAnalytics(),
      compliance: this.getDefaultCompliance(),
      supportTier: 'standard',
      status: 'trial',
      createdAt: serverTimestamp(),
      renewalDate: this.calculateRenewalDate(30) // 30-day trial
    };
    
    await setDoc(enterpriseRef, enterprise);
    
    // Send welcome email to admin
    await this.sendEnterpriseWelcomeEmail(adminEmail, enterprise);
    
    // Create Stripe customer
    await this.createStripeCustomer(enterprise);
    
    return enterpriseRef.id;
  }
  
  async inviteUsers(enterpriseId: string, invitations: UserInvitation[], invitedBy: string): Promise<InvitationResult[]> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise account not found');
    
    const results: InvitationResult[] = [];
    
    for (const invitation of invitations) {
      try {
        // Check user limit
        if (enterprise.users.length >= enterprise.subscription.userLimit) {
          results.push({
            email: invitation.email,
            status: 'failed',
            reason: 'User limit exceeded'
          });
          continue;
        }
        
        // Check if user already exists
        const existingUser = enterprise.users.find(u => u.email === invitation.email);
        if (existingUser) {
          results.push({
            email: invitation.email,
            status: 'failed',
            reason: 'User already exists'
          });
          continue;
        }
        
        // Create invitation
        const invitationId = await this.createUserInvitation(enterpriseId, invitation, invitedBy);
        
        // Send invitation email
        await this.sendInvitationEmail(invitation.email, enterprise, invitationId);
        
        results.push({
          email: invitation.email,
          status: 'sent',
          invitationId
        });
        
      } catch (error) {
        results.push({
          email: invitation.email,
          status: 'failed',
          reason: error.message
        });
      }
    }
    
    return results;
  }
  
  async generateAnalyticsReport(enterpriseId: string, reportType: string, filters: ReportFilters): Promise<AnalyticsReport> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise account not found');
    
    switch (reportType) {
      case 'user_engagement':
        return await this.generateUserEngagementReport(enterpriseId, filters);
      
      case 'skill_development':
        return await this.generateSkillDevelopmentReport(enterpriseId, filters);
      
      case 'department_performance':
        return await this.generateDepartmentPerformanceReport(enterpriseId, filters);
      
      case 'roi_analysis':
        return await this.generateROIReport(enterpriseId, filters);
      
      case 'custom':
        return await this.generateCustomReport(enterpriseId, filters);
      
      default:
        throw new Error('Invalid report type');
    }
  }
  
  private async generateUserEngagementReport(enterpriseId: string, filters: ReportFilters): Promise<AnalyticsReport> {
    // Query user activity data
    const usersQuery = query(
      collection(this.db, 'users'),
      where('enterpriseId', '==', enterpriseId),
      where('lastActivity', '>=', filters.startDate),
      where('lastActivity', '<=', filters.endDate)
    );
    
    const users = await getDocs(usersQuery);
    const userData = users.docs.map(doc => doc.data() as EnterpriseUser);
    
    // Calculate engagement metrics
    const totalUsers = userData.length;
    const activeUsers = userData.filter(u => this.isActiveUser(u, filters)).length;
    const engagementRate = (activeUsers / totalUsers) * 100;
    
    const sessionData = await this.getUserSessionData(enterpriseId, filters);
    const averageSessionsPerUser = sessionData.totalSessions / totalUsers;
    const averageSessionDuration = sessionData.totalDuration / sessionData.totalSessions;
    
    return {
      reportId: this.generateReportId(),
      enterpriseId,
      reportType: 'user_engagement',
      generatedAt: serverTimestamp(),
      filters,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          engagementRate,
          averageSessionsPerUser,
          averageSessionDuration
        },
        trends: await this.calculateEngagementTrends(enterpriseId, filters),
        departmentBreakdown: await this.getEngagementByDepartment(userData),
        topPerformers: await this.getTopEngagedUsers(userData, 10),
        recommendations: await this.generateEngagementRecommendations(userData)
      },
      charts: await this.generateEngagementCharts(userData, sessionData),
      exportFormats: ['pdf', 'excel', 'csv']
    };
  }
  
  async setupSSOIntegration(enterpriseId: string, ssoConfig: SSOConfiguration): Promise<void> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise account not found');
    
    // Validate SSO configuration
    await this.validateSSOConfig(ssoConfig);
    
    // Create integration record
    const integration: EnterpriseIntegration = {
      type: 'sso',
      provider: ssoConfig.provider,
      configuration: {
        ...ssoConfig,
        certificates: await this.storeSSOCertificates(ssoConfig.certificates)
      },
      status: 'inactive',
      lastSync: serverTimestamp()
    };
    
    // Test SSO connection
    try {
      await this.testSSOConnection(integration);
      integration.status = 'active';
    } catch (error) {
      integration.status = 'error';
      integration.syncErrors = [error.message];
    }
    
    // Update enterprise account
    await updateDoc(doc(this.db, 'enterpriseAccounts', enterpriseId), {
      integrations: arrayUnion(integration)
    });
    
    // Configure authentication provider
    if (integration.status === 'active') {
      await this.configureAuthProvider(enterpriseId, integration);
    }
  }
  
  async customizeEnterpriseBranding(enterpriseId: string, branding: Partial<EnterpriseBranding>): Promise<void> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise account not found');
    
    // Validate branding assets
    if (branding.companyLogo) {
      await this.validateAndOptimizeLogo(branding.companyLogo);
    }
    
    if (branding.primaryColor) {
      await this.validateColorScheme(branding.primaryColor, branding.secondaryColor);
    }
    
    // Generate custom CSS
    if (branding.primaryColor || branding.secondaryColor) {
      const customCSS = await this.generateCustomCSS(branding);
      branding.customCSS = customCSS;
    }
    
    // Setup custom domain if requested
    if (branding.customDomain) {
      await this.setupCustomDomain(enterpriseId, branding.customDomain);
    }
    
    // Update enterprise branding
    await updateDoc(doc(this.db, 'enterpriseAccounts', enterpriseId), {
      customization: { ...enterprise.customization, ...branding }
    });
    
    // Invalidate CDN cache for immediate updates
    await this.invalidateBrandingCache(enterpriseId);
  }
  
  async manageUserPermissions(enterpriseId: string, userId: string, permissions: UserPermission[]): Promise<void> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise account not found');
    
    // Find user in enterprise
    const userIndex = enterprise.users.findIndex(u => u.userId === userId);
    if (userIndex === -1) throw new Error('User not found in enterprise');
    
    // Validate permissions against subscription plan
    const validPermissions = await this.validatePermissions(permissions, enterprise.subscription.plan);
    
    // Update user permissions
    enterprise.users[userIndex].permissions = validPermissions;
    
    await updateDoc(doc(this.db, 'enterpriseAccounts', enterpriseId), {
      users: enterprise.users
    });
    
    // Update user's individual permissions
    await updateDoc(doc(this.db, 'users', userId, 'profile', 'data'), {
      enterprisePermissions: validPermissions,
      updatedAt: serverTimestamp()
    });
    
    // Log permission change
    await this.logPermissionChange(enterpriseId, userId, permissions);
  }
  
  private async validateSSOConfig(config: SSOConfiguration): Promise<void> {
    // Validate required fields
    if (!config.entityId || !config.ssoUrl || !config.certificates) {
      throw new Error('Missing required SSO configuration fields');
    }
    
    // Validate certificate format
    for (const cert of config.certificates) {
      if (!this.isValidX509Certificate(cert)) {
        throw new Error('Invalid X.509 certificate format');
      }
    }
    
    // Validate URLs
    if (!this.isValidUrl(config.ssoUrl) || !this.isValidUrl(config.sloUrl)) {
      throw new Error('Invalid SSO URLs');
    }
  }
  
  private async testSSOConnection(integration: EnterpriseIntegration): Promise<void> {
    // Implement SAML/OIDC connection testing
    // This would involve making test authentication requests
    console.log('Testing SSO connection for', integration.provider);
  }
  
  private async generateCustomCSS(branding: Partial<EnterpriseBranding>): Promise<string> {
    return `
      :root {
        --primary-color: ${branding.primaryColor};
        --secondary-color: ${branding.secondaryColor};
        --logo-url: url('${branding.companyLogo}');
      }
      
      .gi-branded-header {
        background-color: var(--primary-color);
      }
      
      .gi-branded-button {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      .gi-branded-logo {
        background-image: var(--logo-url);
      }
    `;
  }
  
  private async setupCustomDomain(enterpriseId: string, domain: string): Promise<void> {
    // Validate domain ownership
    await this.validateDomainOwnership(domain);
    
    // Configure DNS records
    await this.configureDNSRecords(domain, enterpriseId);
    
    // Setup SSL certificate
    await this.setupSSLCertificate(domain);
    
    // Update routing configuration
    await this.updateRoutingConfig(enterpriseId, domain);
  }
  
  // Helper methods
  private generateAdminId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateNextBilling(cycle: 'monthly' | 'annual'): Timestamp {
    const nextBilling = new Date();
    if (cycle === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }
    return Timestamp.fromDate(nextBilling);
  }
  
  private calculateRenewalDate(days: number): Timestamp {
    const renewal = new Date();
    renewal.setDate(renewal.getDate() + days);
    return Timestamp.fromDate(renewal);
  }
  
  private getAllAdminPermissions(): AdminPermission[] {
    return [
      'user_management',
      'billing_management',
      'analytics_access',
      'integration_management',
      'branding_customization',
      'report_generation',
      'bulk_operations'
    ];
  }
  
  private getDefaultBranding(): EnterpriseBranding {
    return {
      companyLogo: '',
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6',
      emailTemplates: [],
      loginPage: {} as CustomLoginPage,
      whiteLabel: false
    };
  }
  
  private getDefaultAnalytics(): EnterpriseAnalytics {
    return {
      userEngagement: {} as UserEngagementMetrics,
      skillDevelopment: {} as SkillDevelopmentMetrics,
      departmentPerformance: [],
      roiAnalysis: {} as ROIMetrics,
      customReports: [],
      exportSchedule: []
    };
  }
  
  private getDefaultCompliance(): ComplianceSettings {
    return {
      dataRetention: 365, // days
      auditLogging: true,
      encryptionAtRest: true,
      accessLogging: true,
      complianceStandards: ['SOC2', 'GDPR']
    };
  }
}

// Enterprise Dashboard UI Component
export function EnterpriseAdminDashboard({ enterpriseId }: { enterpriseId: string }) {
  const [enterprise, setEnterprise] = useState<EnterpriseAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  
  const enterpriseService = useRef(new EnterpriseService());
  
  useEffect(() => {
    loadEnterpriseData();
  }, [enterpriseId]);
  
  const loadEnterpriseData = async () => {
    setLoading(true);
    try {
      const data = await enterpriseService.current.getEnterpriseAccount(enterpriseId);
      setEnterprise(data);
    } catch (error) {
      console.error('Error loading enterprise data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="gi-loading-state">
        <Loader className="gi-spinner" />
        <p>Loading enterprise dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="gi-enterprise-dashboard">
      <div className="gi-dashboard-header">
        <div className="gi-company-info">
          {enterprise?.customization.companyLogo && (
            <img src={enterprise.customization.companyLogo} alt="Company Logo" className="gi-company-logo" />
          )}
          <div>
            <h1>{enterprise?.companyInfo.name}</h1>
            <p>{enterprise?.subscription.plan} Plan • {enterprise?.users.length}/{enterprise?.subscription.userLimit} Users</p>
          </div>
        </div>
        
        <div className="gi-dashboard-actions">
          <button className="gi-btn gi-btn-outline">
            <Download size={16} />
            Export Data
          </button>
          <button className="gi-btn gi-btn-primary">
            <Plus size={16} />
            Invite Users
          </button>
        </div>
      </div>
      
      <div className="gi-dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`gi-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="gi-tab-content">
        {activeTab === 'overview' && <EnterpriseOverview enterprise={enterprise!} />}
        {activeTab === 'users' && <UserManagement enterprise={enterprise!} onUpdate={loadEnterpriseData} />}
        {activeTab === 'analytics' && <EnterpriseAnalytics enterprise={enterprise!} />}
        {activeTab === 'settings' && <EnterpriseSettings enterprise={enterprise!} onUpdate={loadEnterpriseData} />}
      </div>
    </div>
  );
}
```

### 1.2 Single Sign-On (SSO) & Integration APIs

#### SSO Integration System
```typescript
// SSO Integration types and implementation
interface SSOConfiguration {
  provider: 'okta' | 'azure_ad' | 'google_workspace' | 'ping_identity' | 'auth0' | 'custom_saml';
  protocol: 'saml' | 'oidc' | 'oauth2';
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificates: string[];
  attributeMapping: AttributeMapping;
  userProvisioning: ProvisioningConfig;
  groupMapping: GroupMapping[];
  securitySettings: SSOSecuritySettings;
}

interface AttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  title?: string;
  employeeId?: string;
  manager?: string;
}

interface ProvisioningConfig {
  autoCreateUsers: boolean;
  autoUpdateUsers: boolean;
  autoDeactivateUsers: boolean;
  defaultRole: string;
  defaultGroups: string[];
}

interface GroupMapping {
  ssoGroup: string;
  enterpriseRole: string;
  permissions: string[];
}

interface SSOSecuritySettings {
  requireSignedAssertion: boolean;
  requireSignedResponse: boolean;
  encryptAssertion: boolean;
  sessionTimeout: number; // minutes
  requireMFA: boolean;
}

// SSOIntegrationService.ts
export class SSOIntegrationService {
  private db = getFirestore();
  
  async configureSAMLIntegration(enterpriseId: string, config: SSOConfiguration): Promise<void> {
    // Validate SAML configuration
    await this.validateSAMLConfig(config);
    
    // Store SSO configuration
    const ssoConfigRef = doc(this.db, 'ssoConfigurations', enterpriseId);
    await setDoc(ssoConfigRef, {
      ...config,
      status: 'active',
      createdAt: serverTimestamp(),
      lastTested: serverTimestamp()
    });
    
    // Update enterprise integration
    await updateDoc(doc(this.db, 'enterpriseAccounts', enterpriseId), {
      'integrations': arrayUnion({
        type: 'sso',
        provider: config.provider,
        status: 'active',
        lastSync: serverTimestamp()
      })
    });
    
    // Setup authentication middleware
    await this.setupSAMLMiddleware(enterpriseId, config);
  }
  
  async handleSAMLResponse(enterpriseId: string, samlResponse: string, relayState?: string): Promise<SSOAuthResult> {
    const config = await this.getSSOConfig(enterpriseId);
    if (!config) throw new Error('SSO not configured for this enterprise');
    
    // Validate SAML response
    const validationResult = await this.validateSAMLResponse(samlResponse, config);
    if (!validationResult.isValid) {
      throw new Error(`SAML validation failed: ${validationResult.error}`);
    }
    
    // Extract user attributes
    const userAttributes = this.extractSAMLAttributes(validationResult.assertion, config.attributeMapping);
    
    // Provision or update user
    const user = await this.provisionUser(enterpriseId, userAttributes, config.userProvisioning);
    
    // Create session
    const sessionToken = await this.createSSOSession(user.userId, enterpriseId);
    
    return {
      success: true,
      user,
      sessionToken,
      redirectUrl: relayState || '/dashboard'
    };
  }
  
  async initiateSSO(enterpriseId: string, returnUrl?: string): Promise<SSOInitiationResult> {
    const config = await this.getSSOConfig(enterpriseId);
    if (!config) throw new Error('SSO not configured');
    
    const requestId = this.generateSAMLRequestId();
    const timestamp = new Date().toISOString();
    
    // Generate SAML AuthnRequest
    const samlRequest = this.generateSAMLRequest({
      id: requestId,
      timestamp,
      issuer: config.entityId,
      destination: config.ssoUrl,
      returnUrl
    });
    
    // Store request for validation
    await this.storeSAMLRequest(enterpriseId, requestId, returnUrl);
    
    return {
      ssoUrl: config.ssoUrl,
      samlRequest: this.encodeSAMLRequest(samlRequest),
      relayState: returnUrl
    };
  }
  
  private async validateSAMLResponse(samlResponse: string, config: SSOConfiguration): Promise<SAMLValidationResult> {
    try {
      // Decode SAML response
      const decodedResponse = this.decodeSAMLResponse(samlResponse);
      
      // Validate signature if required
      if (config.securitySettings.requireSignedResponse) {
        const signatureValid = await this.validateSAMLSignature(decodedResponse, config.certificates);
        if (!signatureValid) {
          return { isValid: false, error: 'Invalid response signature' };
        }
      }
      
      // Validate timestamp
      const timestampValid = this.validateSAMLTimestamp(decodedResponse);
      if (!timestampValid) {
        return { isValid: false, error: 'Response timestamp expired' };
      }
      
      // Validate audience restriction
      const audienceValid = this.validateSAMLAudience(decodedResponse, config.entityId);
      if (!audienceValid) {
        return { isValid: false, error: 'Invalid audience restriction' };
      }
      
      return {
        isValid: true,
        assertion: decodedResponse.assertion,
        attributes: decodedResponse.attributes
      };
      
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
  
  private async provisionUser(enterpriseId: string, attributes: any, provisioning: ProvisioningConfig): Promise<EnterpriseUser> {
    const email = attributes[Object.keys(attributes).find(key => key.toLowerCase().includes('email'))];
    
    if (!email) throw new Error('Email attribute not found in SAML response');
    
    // Check if user exists
    const existingUser = await this.findUserByEmail(enterpriseId, email);
    
    if (existingUser) {
      // Update existing user if auto-update is enabled
      if (provisioning.autoUpdateUsers) {
        return await this.updateUserFromSSO(existingUser, attributes);
      }
      return existingUser;
    }
    
    // Create new user if auto-create is enabled
    if (provisioning.autoCreateUsers) {
      return await this.createUserFromSSO(enterpriseId, attributes, provisioning);
    }
    
    throw new Error('User not found and auto-provisioning is disabled');
  }
  
  private async createUserFromSSO(enterpriseId: string, attributes: any, provisioning: ProvisioningConfig): Promise<EnterpriseUser> {
    const userRef = doc(collection(this.db, 'users'));
    
    const user: EnterpriseUser = {
      userId: userRef.id,
      email: attributes.email,
      department: attributes.department || '',
      position: attributes.title || '',
      manager: attributes.manager,
      permissions: this.getDefaultPermissions(provisioning.defaultRole),
      usageStats: this.getDefaultUsageStats(),
      groups: provisioning.defaultGroups,
      status: 'active',
      lastActivity: serverTimestamp()
    };
    
    // Create user profile
    await setDoc(doc(this.db, 'users', user.userId, 'profile', 'data'), {
      uid: user.userId,
      email: user.email,
      displayName: `${attributes.firstName} ${attributes.lastName}`,
      enterpriseId,
      ssoProvisioned: true,
      createdAt: serverTimestamp()
    });
    
    // Add user to enterprise
    await updateDoc(doc(this.db, 'enterpriseAccounts', enterpriseId), {
      users: arrayUnion(user),
      'subscription.currentUsers': increment(1)
    });
    
    return user;
  }
}

// API Integration Framework
interface APIIntegration {
  integrationId: string;
  enterpriseId: string;
  type: 'hr_system' | 'lms' | 'ats' | 'custom';
  name: string;
  description: string;
  apiConfiguration: APIConfig;
  dataMapping: DataMapping;
  syncSchedule: SyncSchedule;
  status: 'active' | 'inactive' | 'error';
  lastSync: Timestamp;
  syncStats: SyncStatistics;
}

interface APIConfig {
  baseUrl: string;
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token';
    credentials: Record<string, string>;
  };
  headers: Record<string, string>;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  timeout: number; // milliseconds
}

interface DataMapping {
  userFields: FieldMapping[];
  departmentFields: FieldMapping[];
  customFields: FieldMapping[];
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

// APIIntegrationService.ts
export class APIIntegrationService {
  private db = getFirestore();
  private httpClient: HttpClient;
  
  constructor() {
    this.httpClient = new HttpClient();
  }
  
  async createAPIIntegration(enterpriseId: string, config: Partial<APIIntegration>): Promise<string> {
    const integrationRef = doc(collection(this.db, 'apiIntegrations'));
    
    const integration: APIIntegration = {
      integrationId: integrationRef.id,
      enterpriseId,
      type: config.type || 'custom',
      name: config.name || 'Custom Integration',
      description: config.description || '',
      apiConfiguration: config.apiConfiguration!,
      dataMapping: config.dataMapping!,
      syncSchedule: config.syncSchedule || { frequency: 'daily', time: '02:00' },
      status: 'inactive',
      lastSync: serverTimestamp(),
      syncStats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        lastSuccessfulSync: null,
        averageSyncDuration: 0
      }
    };
    
    // Test API connection
    try {
      await this.testAPIConnection(integration);
      integration.status = 'active';
    } catch (error) {
      integration.status = 'error';
    }
    
    await setDoc(integrationRef, integration);
    
    // Schedule sync job
    if (integration.status === 'active') {
      await this.scheduleSync(integration);
    }
    
    return integrationRef.id;
  }
  
  async syncData(integrationId: string): Promise<SyncResult> {
    const integration = await this.getAPIIntegration(integrationId);
    if (!integration) throw new Error('Integration not found');
    
    const syncStart = Date.now();
    let syncResult: SyncResult;
    
    try {
      // Authenticate with external API
      const authToken = await this.authenticateAPI(integration.apiConfiguration);
      
      // Fetch data from external API
      const externalData = await this.fetchExternalData(integration, authToken);
      
      // Transform data according to mapping
      const transformedData = this.transformData(externalData, integration.dataMapping);
      
      // Update enterprise data
      await this.updateEnterpriseData(integration.enterpriseId, transformedData);
      
      syncResult = {
        success: true,
        recordsProcessed: transformedData.length,
        recordsUpdated: transformedData.filter(r => r.action === 'update').length,
        recordsCreated: transformedData.filter(r => r.action === 'create').length,
        duration: Date.now() - syncStart,
        errors: []
      };
      
    } catch (error) {
      syncResult = {
        success: false,
        recordsProcessed: 0,
        recordsUpdated: 0,
        recordsCreated: 0,
        duration: Date.now() - syncStart,
        errors: [error.message]
      };
    }
    
    // Update sync statistics
    await this.updateSyncStats(integrationId, syncResult);
    
    return syncResult;
  }
  
  async generateAPIKey(enterpriseId: string, name: string, permissions: string[]): Promise<APIKey> {
    const apiKey: APIKey = {
      keyId: this.generateAPIKeyId(),
      enterpriseId,
      name,
      key: this.generateSecureAPIKey(),
      permissions,
      status: 'active',
      createdAt: serverTimestamp(),
      lastUsed: null,
      usageCount: 0,
      expiresAt: this.calculateExpiryDate(365) // 1 year
    };
    
    // Store API key (hash the actual key)
    await setDoc(doc(this.db, 'apiKeys', apiKey.keyId), {
      ...apiKey,
      keyHash: await this.hashAPIKey(apiKey.key)
    });
    
    return apiKey;
  }
  
  private async testAPIConnection(integration: APIIntegration): Promise<void> {
    const authToken = await this.authenticateAPI(integration.apiConfiguration);
    
    // Make test API call
    const response = await this.httpClient.get(
      `${integration.apiConfiguration.baseUrl}/health`,
      {
        headers: {
          ...integration.apiConfiguration.headers,
          'Authorization': `Bearer ${authToken}`
        },
        timeout: integration.apiConfiguration.timeout
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`API test failed with status: ${response.status}`);
    }
  }
  
  private async authenticateAPI(config: APIConfig): Promise<string> {
    switch (config.authentication.type) {
      case 'oauth2':
        return await this.authenticateOAuth2(config);
      case 'api_key':
        return config.authentication.credentials.apiKey;
      case 'bearer_token':
        return config.authentication.credentials.token;
      default:
        throw new Error('Unsupported authentication type');
    }
  }
  
  private async authenticateOAuth2(config: APIConfig): Promise<string> {
    const tokenResponse = await this.httpClient.post(`${config.baseUrl}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: config.authentication.credentials.clientId,
      client_secret: config.authentication.credentials.clientSecret
    });
    
    return tokenResponse.data.access_token;
  }
}
```

### 1.3 Enterprise Analytics & Reporting

#### Advanced Analytics Dashboard
```typescript
// Enterprise analytics types
interface EnterpriseAnalyticsDashboard {
  enterpriseId: string;
  dashboardConfig: DashboardConfiguration;
  widgets: AnalyticsWidget[];
  filters: GlobalFilter[];
  exportOptions: ExportOption[];
  permissions: AnalyticsPermission[];
  lastUpdated: Timestamp;
}

interface AnalyticsWidget {
  widgetId: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'gauge' | 'trend';
  title: string;
  description: string;
  dataSource: DataSource;
  visualization: VisualizationConfig;
  filters: WidgetFilter[];
  position: { row: number; col: number; width: number; height: number };
  refreshInterval: number; // minutes
  permissions: string[];
}

interface DataSource {
  type: 'user_activity' | 'session_data' | 'skill_assessment' | 'department_metrics' | 'custom_query';
  query: DataQuery;
  aggregation: AggregationConfig;
  timeRange: TimeRange;
}

interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge';
  axes: AxisConfig[];
  series: SeriesConfig[];
  colors: string[];
  options: ChartOptions;
}

// EnterpriseAnalyticsService.ts
export class EnterpriseAnalyticsService {
  private db = getFirestore();
  
  async generateDashboard(enterpriseId: string): Promise<EnterpriseAnalyticsDashboard> {
    const enterprise = await this.getEnterpriseAccount(enterpriseId);
    if (!enterprise) throw new Error('Enterprise not found');
    
    // Generate default widgets based on enterprise size and industry
    const widgets = await this.generateDefaultWidgets(enterprise);
    
    const dashboard: EnterpriseAnalyticsDashboard = {
      enterpriseId,
      dashboardConfig: {
        layout: 'grid',
        theme: 'corporate',
        autoRefresh: true,
        refreshInterval: 15 // minutes
      },
      widgets,
      filters: this.getDefaultFilters(),
      exportOptions: this.getExportOptions(),
      permissions: this.getAnalyticsPermissions(enterprise),
      lastUpdated: serverTimestamp()
    };
    
    await this.saveDashboard(dashboard);
    return dashboard;
  }
  
  private async generateDefaultWidgets(enterprise: EnterpriseAccount): Promise<AnalyticsWidget[]> {
    const widgets: AnalyticsWidget[] = [];
    
    // User Engagement Overview
    widgets.push({
      widgetId: 'user-engagement-overview',
      type: 'metric',
      title: 'User Engagement Overview',
      description: 'Key engagement metrics for all users',
      dataSource: {
        type: 'user_activity',
        query: { metric: 'engagement_rate', groupBy: 'department' },
        aggregation: { function: 'average', period: 'week' },
        timeRange: { start: '30d', end: 'now' }
      },
      visualization: {
        chartType: 'gauge',
        axes: [],
        series: [{ name: 'Engagement Rate', field: 'engagement_rate' }],
        colors: ['#22c55e', '#eab308', '#ef4444'],
        options: { min: 0, max: 100, thresholds: [50, 80] }
      },
      filters: [],
      position: { row: 0, col: 0, width: 4, height: 3 },
      refreshInterval: 15,
      permissions: ['analytics_view']
    });
    
    // Session Trends
    widgets.push({
      widgetId: 'session-trends',
      type: 'chart',
      title: 'Practice Session Trends',
      description: 'Daily session volume and completion rates',
      dataSource: {
        type: 'session_data',
        query: { metric: 'session_count', groupBy: 'date' },
        aggregation: { function: 'count', period: 'day' },
        timeRange: { start: '30d', end: 'now' }
      },
      visualization: {
        chartType: 'line',
        axes: [
          { name: 'x', field: 'date', type: 'datetime' },
          { name: 'y', field: 'session_count', type: 'numeric' }
        ],
        series: [
          { name: 'Sessions', field: 'session_count' },
          { name: 'Completions', field: 'completion_count' }
        ],
        colors: ['#3b82f6', '#10b981'],
        options: { smooth: true, showDataPoints: false }
      },
      filters: [{ field: 'department', type: 'multiselect' }],
      position: { row: 0, col: 4, width: 8, height: 4 },
      refreshInterval: 30,
      permissions: ['analytics_view']
    });
    
    // Department Performance Comparison
    widgets.push({
      widgetId: 'department-performance',
      type: 'chart',
      title: 'Department Performance Comparison',
      description: 'Average scores and improvement rates by department',
      dataSource: {
        type: 'department_metrics',
        query: { metric: 'average_score', groupBy: 'department' },
        aggregation: { function: 'average', period: 'month' },
        timeRange: { start: '90d', end: 'now' }
      },
      visualization: {
        chartType: 'bar',
        axes: [
          { name: 'x', field: 'department', type: 'category' },
          { name: 'y', field: 'average_score', type: 'numeric' }
        ],
        series: [{ name: 'Average Score', field: 'average_score' }],
        colors: ['#8b5cf6'],
        options: { horizontal: false, showValues: true }
      },
      filters: [],
      position: { row: 4, col: 0, width: 6, height: 4 },
      refreshInterval: 60,
      permissions: ['analytics_view', 'department_view']
    });
    
    // Skill Development Heatmap
    widgets.push({
      widgetId: 'skill-heatmap',
      type: 'heatmap',
      title: 'Skill Development Heatmap',
      description: 'Skill improvement across different areas',
      dataSource: {
        type: 'skill_assessment',
        query: { metric: 'improvement_rate', groupBy: ['skill', 'department'] },
        aggregation: { function: 'average', period: 'month' },
        timeRange: { start: '90d', end: 'now' }
      },
      visualization: {
        chartType: 'heatmap',
        axes: [
          { name: 'x', field: 'skill', type: 'category' },
          { name: 'y', field: 'department', type: 'category' }
        ],
        series: [{ name: 'Improvement Rate', field: 'improvement_rate' }],
        colors: ['#f3f4f6', '#3b82f6', '#1e40af'],
        options: { cellSize: 'auto', showValues: true }
      },
      filters: [{ field: 'time_period', type: 'date_range' }],
      position: { row: 4, col: 6, width: 6, height: 4 },
      refreshInterval: 60,
      permissions: ['analytics_view', 'skill_analysis']
    });
    
    // ROI Analysis
    if (enterprise.subscription.plan === 'enterprise' || enterprise.subscription.plan === 'custom') {
      widgets.push({
        widgetId: 'roi-analysis',
        type: 'metric',
        title: 'Training ROI Analysis',
        description: 'Return on investment for interview training programs',
        dataSource: {
          type: 'custom_query',
          query: { 
            metric: 'roi_percentage',
            calculation: 'roi_formula' 
          },
          aggregation: { function: 'latest', period: 'month' },
          timeRange: { start: '12m', end: 'now' }
        },
        visualization: {
          chartType: 'gauge',
          axes: [],
          series: [{ name: 'ROI %', field: 'roi_percentage' }],
          colors: ['#ef4444', '#eab308', '#22c55e'],
          options: { min: -50, max: 200, thresholds: [0, 100] }
        },
        filters: [],
        position: { row: 8, col: 0, width: 4, height: 3 },
        refreshInterval: 120,
        permissions: ['analytics_view', 'roi_analysis']
      });
    }
    
    return widgets;
  }
  
  async generateCustomReport(enterpriseId: string, reportConfig: CustomReportConfig): Promise<CustomReport> {
    const startTime = Date.now();
    
    // Validate report configuration
    await this.validateReportConfig(reportConfig);
    
    // Execute data queries
    const dataResults = await Promise.all(
      reportConfig.dataSources.map(source => this.executeDataQuery(enterpriseId, source))
    );
    
    // Combine and process data
    const processedData = this.processReportData(dataResults, reportConfig);
    
    // Generate visualizations
    const visualizations = await this.generateReportVisualizations(processedData, reportConfig);
    
    // Create report document
    const report: CustomReport = {
      reportId: this.generateReportId(),
      enterpriseId,
      title: reportConfig.title,
      description: reportConfig.description,
      generatedAt: serverTimestamp(),
      generatedBy: reportConfig.requestedBy,
      config: reportConfig,
      data: processedData,
      visualizations,
      summary: this.generateReportSummary(processedData),
      insights: await this.generateReportInsights(processedData),
      exportFormats: ['pdf', 'excel', 'powerpoint'],
      processingTime: Date.now() - startTime
    };
    
    // Store report
    await this.saveCustomReport(report);
    
    // Schedule for cleanup if temporary
    if (reportConfig.temporary) {
      this.scheduleReportCleanup(report.reportId, reportConfig.retentionDays || 30);
    }
    
    return report;
  }
  
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'powerpoint'): Promise<ExportResult> {
    const report = await this.getCustomReport(reportId);
    if (!report) throw new Error('Report not found');
    
    switch (format) {
      case 'pdf':
        return await this.exportToPDF(report);
      case 'excel':
        return await this.exportToExcel(report);
      case 'powerpoint':
        return await this.exportToPowerPoint(report);
      default:
        throw new Error('Unsupported export format');
    }
  }
  
  private async exportToPDF(report: CustomReport): Promise<ExportResult> {
    // Generate PDF using a library like Puppeteer or jsPDF
    const pdfBuffer = await this.generatePDFReport(report);
    
    // Upload to cloud storage
    const downloadUrl = await this.uploadReportFile(report.reportId, 'pdf', pdfBuffer);
    
    return {
      success: true,
      format: 'pdf',
      downloadUrl,
      fileName: `${report.title.replace(/\s+/g, '_')}_${report.reportId}.pdf`,
      fileSize: pdfBuffer.length
    };
  }
  
  private async exportToExcel(report: CustomReport): Promise<ExportResult> {
    // Generate Excel file using a library like ExcelJS
    const excelBuffer = await this.generateExcelReport(report);
    
    const downloadUrl = await this.uploadReportFile(report.reportId, 'xlsx', excelBuffer);
    
    return {
      success: true,
      format: 'excel',
      downloadUrl,
      fileName: `${report.title.replace(/\s+/g, '_')}_${report.reportId}.xlsx`,
      fileSize: excelBuffer.length
    };
  }
  
  async scheduleRecurringReport(enterpriseId: string, reportConfig: RecurringReportConfig): Promise<string> {
    const scheduleId = this.generateScheduleId();
    
    const schedule: ReportSchedule = {
      scheduleId,
      enterpriseId,
      reportConfig,
      frequency: reportConfig.frequency,
      schedule: reportConfig.schedule,
      recipients: reportConfig.recipients,
      status: 'active',
      nextRun: this.calculateNextRun(reportConfig.schedule),
      lastRun: null,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(this.db, 'reportSchedules', scheduleId), schedule);
    
    // Register with job scheduler
    await this.registerScheduledJob(schedule);
    
    return scheduleId;
  }
  
  private async executeDataQuery(enterpriseId: string, source: DataSource): Promise<QueryResult> {
    switch (source.type) {
      case 'user_activity':
        return await this.queryUserActivity(enterpriseId, source);
      case 'session_data':
        return await this.querySessionData(enterpriseId, source);
      case 'skill_assessment':
        return await this.querySkillAssessments(enterpriseId, source);
      case 'department_metrics':
        return await this.queryDepartmentMetrics(enterpriseId, source);
      case 'custom_query':
        return await this.executeCustomQuery(enterpriseId, source);
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }
  
  private async queryUserActivity(enterpriseId: string, source: DataSource): Promise<QueryResult> {
    const timeRange = this.parseTimeRange(source.timeRange);
    
    const usersQuery = query(
      collection(this.db, 'users'),
      where('enterpriseId', '==', enterpriseId),
      where('lastActivity', '>=', timeRange.start),
      where('lastActivity', '<=', timeRange.end)
    );
    
    const users = await getDocs(usersQuery);
    const userData = users.docs.map(doc => doc.data());
    
    // Calculate engagement metrics
    const result = this.calculateEngagementMetrics(userData, source.aggregation);
    
    return {
      data: result,
      recordCount: userData.length,
      executionTime: Date.now(),
      source: source.type
    };
  }
  
  private calculateEngagementMetrics(userData: any[], aggregation: AggregationConfig): any[] {
    // Group data by the specified period
    const groupedData = this.groupDataByPeriod(userData, aggregation.period);
    
    // Apply aggregation function
    return Object.entries(groupedData).map(([period, users]) => {
      const totalUsers = users.length;
      const activeUsers = users.filter(u => this.isActiveInPeriod(u, period)).length;
      const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      
      return {
        period,
        totalUsers,
        activeUsers,
        engagementRate,
        averageSessionsPerUser: this.calculateAverageSessionsPerUser(users),
        averageTimeSpent: this.calculateAverageTimeSpent(users)
      };
    });
  }
  
  private async generateReportInsights(data: any[]): Promise<ReportInsight[]> {
    // Use AI to generate insights from the data
    const model = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!).getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });
    
    const prompt = `
      Analyze this enterprise training data and provide actionable insights:
      
      Data: ${JSON.stringify(data.slice(0, 100))} // Limit for token constraints
      
      Generate 5-7 key insights that include:
      1. Performance trends and patterns
      2. Areas of concern or opportunity
      3. Departmental comparisons
      4. Recommendations for improvement
      5. ROI implications
      
      Focus on actionable insights that enterprise administrators can use.
      Return as JSON array of insight objects with title, description, impact, and recommendation fields.
    `;
    
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return JSON.parse(response);
    } catch (error) {
      console.error('AI insights generation error:', error);
      return this.generateFallbackInsights(data);
    }
  }
  
  // Helper methods
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private parseTimeRange(timeRange: TimeRange): { start: Timestamp; end: Timestamp } {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    if (typeof timeRange.start === 'string') {
      const value = parseInt(timeRange.start.slice(0, -1));
      const unit = timeRange.start.slice(-1);
      
      start = new Date(now);
      switch (unit) {
        case 'd':
          start.setDate(start.getDate() - value);
          break;
        case 'w':
          start.setDate(start.getDate() - (value * 7));
          break;
        case 'm':
          start.setMonth(start.getMonth() - value);
          break;
        case 'y':
          start.setFullYear(start.getFullYear() - value);
          break;
      }
    } else {
      start = timeRange.start.toDate();
    }
    
    if (timeRange.end !== 'now') {
      end = timeRange.end.toDate();
    }
    
    return {
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end)
    };
  }
}
```

---

## Feature 2: Mobile Application Development

### 2.1 React Native Mobile App

#### Mobile App Architecture
```typescript
// Mobile app core structure
// App.tsx - Main app entry point
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AuthProvider } from './src/contexts/AuthContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { useAppInitialization } from './src/hooks/useAppInitialization';

const Stack = createStackNavigator();

export default function App() {
  const { isInitialized, isLoading } = useAppInitialization();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <Provider store={store}>
      <AuthProvider>
        <OfflineProvider>
          <NavigationContainer>
            <AppNavigator isInitialized={isInitialized} />
          </NavigationContainer>
        </OfflineProvider>
      </AuthProvider>
    </Provider>
  );
}

// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { InterviewNavigator } from './InterviewNavigator';

const Stack = createStackNavigator();

export function AppNavigator({ isInitialized }: { isInitialized: boolean }) {
  const { isAuthenticated } = useAuth();
  
  if (!isInitialized) {
    return null;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Interview" component={InterviewNavigator} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Practice':
              iconName = 'play-circle';
              break;
            case 'Progress':
              iconName = 'trending-up';
              break;
            case 'Community':
              iconName = 'users';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// src/screens/InterviewScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/Feather';
import { InterviewQuestion } from '../types/interview';
import { useInterview } from '../hooks/useInterview';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { ResponseRecorder } from '../components/ResponseRecorder';
import { InterviewProgress } from '../components/InterviewProgress';

const { width, height } = Dimensions.get('window');

export function InterviewScreen({ route, navigation }) {
  const { sessionType, questions } = route.params;
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  
  const cameraRef = useRef<Camera>(null);
  const {
    startInterview,
    submitResponse,
    endInterview,
    isLoading,
    error
  } = useInterview();
  
  useEffect(() => {
    initializePermissions();
  }, []);
  
  const initializePermissions = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    if (!audioPermission?.granted) {
      await requestAudioPermission();
    }
  };
  
  const handleStartRecording = async () => {
    if (!cameraPermission?.granted || !audioPermission?.granted) {
      Alert.alert('Permissions Required', 'Camera and microphone access are required for interview practice.');
      return;
    }
    
    setIsRecording(true);
    
    try {
      // Start video recording
      if (cameraRef.current) {
        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 300, // 5 minutes max per question
        });
        
        // Process recording
        await handleRecordingComplete(video.uri);
      }
    } catch (error) {
      console.error('Recording failed:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };
  
  const handleStopRecording = async () => {
    if (isRecording && cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
    setIsRecording(false);
  };
  
  const handleRecordingComplete = async (videoUri: string) => {
    try {
      // Submit response for AI analysis
      const response = await submitResponse({
        questionIndex: currentQuestion,
        videoUri,
        sessionType
      });
      
      setResponses([...responses, response.feedback]);
      
      // Move to next question or complete interview
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        await completeInterview();
      }
      
    } catch (error) {
      console.error('Response submission failed:', error);
      Alert.alert('Submission Error', 'Failed to analyze your response. Please try again.');
    }
  };
  
  const completeInterview = async () => {
    try {
      const result = await endInterview({
        responses,
        sessionType,
        totalQuestions: questions.length
      });
      
      // Navigate to results screen
      navigation.replace('InterviewResults', { result });
      
    } catch (error) {
      console.error('Interview completion failed:', error);
      Alert.alert('Error', 'Failed to complete interview. Please try again.');
    }
  };
  
  const handleSkipQuestion = () => {
    Alert.alert(
      'Skip Question',
      'Are you sure you want to skip this question? You won\'t be able to return to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => {
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1);
            } else {
              completeInterview();
            }
          }
        }
      ]
    );
  };
  
  const handleEndInterview = () => {
    Alert.alert(
      'End Interview',
      'Are you sure you want to end the interview early? Your progress will be saved.',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'End Interview', 
          style: 'destructive',
          onPress: () => completeInterview()
        }
      ]
    );
  };
  
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera" size={64} color="#6b7280" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to record your interview responses.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.front}
        ratio="16:9"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleEndInterview} style={styles.headerButton}>
              <Icon name="x" size={24} color="white" />
            </TouchableOpacity>
            
            <InterviewProgress 
              current={currentQuestion + 1}
              total={questions.length}
              style={styles.progress}
            />
            
            <TouchableOpacity onPress={handleSkipQuestion} style={styles.headerButton}>
              <Icon name="skip-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Question Display */}
          <View style={styles.questionContainer}>
            <QuestionDisplay 
              question={questions[currentQuestion]}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
            />
          </View>
          
          {/* Recording Controls */}
          <View style={styles.controls}>
            <ResponseRecorder
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              disabled={isLoading}
            />
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  camera: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progress: {
    flex: 1,
    marginHorizontal: 16
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  controls: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center'
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f9fafb'
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center'
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

// src/components/QuestionDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InterviewQuestion } from '../types/interview';

interface QuestionDisplayProps {
  question: InterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>
        Question {questionNumber} of {totalQuestions}
      </Text>
      
      <Text style={styles.questionText}>
        {question.question}
      </Text>
      
      {question.context && (
        <Text style={styles.context}>
          {question.context}
        </Text>
      )}
      
      {question.tips && question.tips.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsLabel}>💡 Tip:</Text>
          <Text style={styles.tip}>{question.tips[0]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24
  },
  questionNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500'
  },
  questionText: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 16
  },
  context: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic'
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  tipsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4
  },
  tip: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20
  }
});

// src/components/ResponseRecorder.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface ResponseRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function ResponseRecorder({ 
  isRecording, 
  onStartRecording, 
  onStopRecording, 
  disabled 
}: ResponseRecorderProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton
        ]}
        onPress={isRecording ? onStopRecording : onStartRecording}
        disabled={disabled}
      >
        <Animated.View style={[styles.buttonInner, { transform: [{ scale: pulseAnim }] }]}>
          <Icon 
            name={isRecording ? 'square' : 'circle'} 
            size={32} 
            color="white" 
          />
        </Animated.View>
      </TouchableOpacity>
      
      <Text style={styles.instructionText}>
        {isRecording ? 'Tap to stop recording' : 'Tap to start recording your response'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  recordingButton: {
    backgroundColor: '#dc2626'
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center'
  }
});
```

### 2.2 Offline Capabilities & Sync

#### Offline-First Architecture
```typescript
// src/services/OfflineService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { InterviewSession, Question, UserProfile } from '../types';

interface OfflineData {
  questions: Question[];
  userProfile: UserProfile;
  cachedSessions: InterviewSession[];
  pendingSyncs: PendingSync[];
  lastSync: number;
}

interface PendingSync {
  id: string;
  type: 'session' | 'profile' | 'response';
  data: any;
  timestamp: number;
  attempts: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private syncQueue: PendingSync[] = [];
  private syncInProgress: boolean = false;
  
  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }
  
  async initialize(): Promise<void> {
    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online, start sync
      if (wasOffline && this.isOnline) {
        this.syncPendingData();
      }
    });
    
    // Load pending syncs from storage
    await this.loadPendingSyncs();
    
    // Start periodic sync attempts
    this.startPeriodicSync();
  }
  
  async cacheQuestionsForOffline(questions: Question[]): Promise<void> {
    const offlineData = await this.getOfflineData();
    offlineData.questions = questions;
    await this.saveOfflineData(offlineData);
  }
  
  async getOfflineQuestions(category?: string): Promise<Question[]> {
    const offlineData = await this.getOfflineData();
    const questions = offlineData.questions || [];
    
    if (category) {
      return questions.filter(q => q.category === category);
    }
    
    return questions;
  }
  
  async saveSessionOffline(session: InterviewSession): Promise<void> {
    if (this.isOnline) {
      // Try to save online first
      try {
        await this.saveSessionOnline(session);
        return;
      } catch (error) {
        console.warn('Online save failed, saving offline:', error);
      }
    }
    
    // Save to offline storage
    const offlineData = await this.getOfflineData();
    const existingIndex = offlineData.cachedSessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      offlineData.cachedSessions[existingIndex] = session;
    } else {
      offlineData.cachedSessions.push(session);
    }
    
    await this.saveOfflineData(offlineData);
    
    // Add to sync queue
    await this.addToSyncQueue({
      id: session.id,
      type: 'session',
      data: session,
      timestamp: Date.now(),
      attempts: 0
    });
  }
  
  async getOfflineSessions(): Promise<InterviewSession[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.cachedSessions || [];
  }
  
  async addToSyncQueue(syncItem: Omit<PendingSync, 'attempts'>): Promise<void> {
    const pendingSync: PendingSync = {
      ...syncItem,
      attempts: 0
    };
    
    this.syncQueue.push(pendingSync);
    await this.savePendingSyncs();
    
    // Try immediate sync if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncPendingData();
    }
  }
  
  private async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const remainingItems: PendingSync[] = [];
      
      for (const item of this.syncQueue) {
        try {
          await this.syncItem(item);
          console.log(`Successfully synced ${item.type} with id ${item.id}`);
        } catch (error) {
          console.error(`Failed to sync ${item.type} with id ${item.id}:`, error);
          
          // Increment attempts and keep in queue if under retry limit
          item.attempts++;
          if (item.attempts < 3) {
            remainingItems.push(item);
          } else {
            console.warn(`Giving up on syncing ${item.type} with id ${item.id} after 3 attempts`);
          }
        }
      }
      
      this.syncQueue = remainingItems;
      await this.savePendingSyncs();
      
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async syncItem(item: PendingSync): Promise<void> {
    switch (item.type) {
      case 'session':
        await this.saveSessionOnline(item.data);
        break;
      case 'profile':
        await this.saveProfileOnline(item.data);
        break;
      case 'response':
        await this.saveResponseOnline(item.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }
  
  private async saveSessionOnline(session: InterviewSession): Promise<void> {
    // Implement API call to save session to server
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  
  private async saveProfileOnline(profile: UserProfile): Promise<void> {
    // Implement API call to save profile to server
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  
  private async saveResponseOnline(response: any): Promise<void> {
    // Implement API call to save response to server
    const apiResponse = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
    
    if (!apiResponse.ok) {
      throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
    }
  }
  
  private async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
    
    return {
      questions: [],
      userProfile: {} as UserProfile,
      cachedSessions: [],
      pendingSyncs: [],
      lastSync: 0
    };
  }
  
  private async saveOfflineData(data: OfflineData): Promise<void> {
    try {
      await AsyncStorage.setItem('offlineData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }
  
  private async loadPendingSyncs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('pendingSyncs');
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading pending syncs:', error);
      this.syncQueue = [];
    }
  }
  
  private async savePendingSyncs(): Promise<void> {
    try {
      await AsyncStorage.setItem('pendingSyncs', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving pending syncs:', error);
    }
  }
  
  private startPeriodicSync(): void {
    // Try to sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.syncPendingData();
      }
    }, 30000);
  }
  
  // Public methods for checking sync status
  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }
  
  isOnlineMode(): boolean {
    return this.isOnline;
  }
  
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingData();
    }
  }
  
  async clearOfflineData(): Promise<void> {
    await AsyncStorage.removeItem('offlineData');
    await AsyncStorage.removeItem('pendingSyncs');
    this.syncQueue = [];
  }
}

// src/contexts/OfflineContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { OfflineService } from '../services/OfflineService';

interface OfflineContextType {
  isOnline: boolean;
  syncQueueLength: number;
  syncPendingData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const offlineService = OfflineService.getInstance();
  
  useEffect(() => {
    // Initialize offline service
    offlineService.initialize();
    
    // Set up polling for sync queue updates
    const interval = setInterval(() => {
      setIsOnline(offlineService.isOnlineMode());
      setSyncQueueLength(offlineService.getSyncQueueLength());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const syncPendingData = async () => {
    await offlineService.forcSync();
  };
  
  const clearOfflineData = async () => {
    await offlineService.clearOfflineData();
    setSyncQueueLength(0);
  };
  
  return (
    <OfflineContext.Provider value={{
      isOnline,
      syncQueueLength,
      syncPendingData,
      clearOfflineData
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

// src/components/OfflineIndicator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useOffline } from '../contexts/OfflineContext';

export function OfflineIndicator() {
  const { isOnline, syncQueueLength, syncPendingData } = useOffline();
  
  if (isOnline && syncQueueLength === 0) {
    return null;
  }
  
  return (
    <View style={[styles.container, !isOnline && styles.offlineContainer]}>
      <Icon 
        name={isOnline ? 'upload-cloud' : 'wifi-off'} 
        size={16} 
        color={isOnline ? '#f59e0b' : '#ef4444'} 
      />
      
      <Text style={[styles.text, !isOnline && styles.offlineText]}>
        {isOnline 
          ? `${syncQueueLength} items pending sync`
          : 'You\'re offline'
        }
      </Text>
      
      {isOnline && syncQueueLength > 0 && (
        <TouchableOpacity onPress={syncPendingData} style={styles.syncButton}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 16
  },
  offlineContainer: {
    backgroundColor: '#fee2e2'
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
    flex: 1
  },
  offlineText: {
    color: '#991b1b'
  },
  syncButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  }
});
```

### 2.3 Push Notifications & Engagement

#### Mobile Notification System
```typescript
// src/services/NotificationService.ts
import { Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationPreferences {
  practiceReminders: boolean;
  expertSessionReminders: boolean;
  communityUpdates: boolean;
  achievementNotifications: boolean;
  dailyChallenges: boolean;
  weeklyProgress: boolean;
}

interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  scheduleDate: Date;
  type: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  async initialize(): Promise<void> {
    // Request permission for notifications
    await this.requestPermission();
    
    // Get FCM token for remote notifications
    await this.getFCMToken();
    
    // Configure local notifications
    this.configureLocalNotifications();
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Schedule default practice reminders
    await this.scheduleDefaultReminders();
  }
  
  private async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      return enabled;
    }
    
    return true; // Android doesn't require explicit permission request
  }
  
  private async getFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Save token to user profile for server-side notifications
      await this.saveFCMTokenToProfile(token);
      
      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        this.fcmToken = newToken;
        await this.saveFCMTokenToProfile(newToken);
      });
      
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }
  
  private async saveFCMTokenToProfile(token: string): Promise<void> {
    try {
      // This would typically save to your user profile via API
      await AsyncStorage.setItem('fcmToken', token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }
  
  private configureLocalNotifications(): void {
    PushNotification.configure({
      onNotification: (notification) => {
        console.log('Local notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped the notification
          this.handleNotificationTap(notification);
        }
      },
      
      requestPermissions: Platform.OS === 'ios',
      
      popInitialNotification: true,
      
      requestPermissions: true
    });
    
    // Create notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'practice-reminders',
          channelName: 'Practice Reminders',
          channelDescription: 'Reminders to practice interview skills',
          importance: 4,
          vibrate: true
        },
        () => {}
      );
      
      PushNotification.createChannel(
        {
          channelId: 'achievements',
          channelName: 'Achievements',
          channelDescription: 'Achievement and milestone notifications',
          importance: 3,
          vibrate: true
        },
        () => {}
      );
    }
  }
  
  private setupMessageHandlers(): void {
    // Handle messages when app is in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages
      this.showLocalNotification({
        title: remoteMessage.notification?.title || 'Salamin',
        message: remoteMessage.notification?.body || 'You have a new notification',
        data: remoteMessage.data
      });
    });
    
    // Handle notification tap when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Background notification tap:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });
    
    // Handle notification tap when app is closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });
  }
  
  private handleNotificationTap(notification: any): void {
    const data = notification.data || {};
    
    switch (data.type) {
      case 'practice_reminder':
        // Navigate to practice screen
        this.navigateToScreen('Practice');
        break;
        
      case 'expert_session':
        // Navigate to expert session
        this.navigateToScreen('ExpertSession', { sessionId: data.sessionId });
        break;
        
      case 'achievement':
        // Navigate to achievements screen
        this.navigateToScreen('Achievements');
        break;
        
      case 'community_update':
        // Navigate to community screen
        this.navigateToScreen('Community');
        break;
        
      default:
        // Navigate to main dashboard
        this.navigateToScreen('Dashboard');
    }
  }
  
  private navigateToScreen(screenName: string, params?: any): void {
    // This would integrate with your navigation system
    // Implementation depends on your navigation setup
    console.log(`Navigate to ${screenName}`, params);
  }
  
  async schedulePracticeReminder(
    reminderTime: Date,
    message: string = 'Time for your daily interview practice!'
  ): Promise<string> {
    const notificationId = this.generateNotificationId();
    
    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: 'Practice Reminder',
      message,
      date: reminderTime,
      channelId: 'practice-reminders',
      userInfo: {
        type: 'practice_reminder',
        id: notificationId
      },
      repeatType: 'day' // Repeat daily
    });
    
    return notificationId;
  }
  
  async scheduleExpertSessionReminder(
    sessionTime: Date,
    expertName: string,
    sessionId: string
  ): Promise<void> {
    const reminderTime = new Date(sessionTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    PushNotification.localNotificationSchedule({
      id: this.generateNotificationId(),
      title: 'Expert Session Starting Soon',
      message: `Your session with ${expertName} starts in 15 minutes`,
      date: reminderTime,
      channelId: 'practice-reminders',
      userInfo: {
        type: 'expert_session',
        sessionId
      }
    });
  }
  
  async showAchievementNotification(
    achievementTitle: string,
    achievementDescription: string
  ): Promise<void> {
    this.showLocalNotification({
      title: `🎉 Achievement Unlocked!`,
      message: `${achievementTitle}: ${achievementDescription}`,
      channelId: 'achievements',
      data: {
        type: 'achievement',
        title: achievementTitle
      }
    });
  }
  
  private showLocalNotification({
    title,
    message,
    channelId = 'default',
    data = {}
  }: {
    title: string;
    message: string;
    channelId?: string;
    data?: any;
  }): void {
    PushNotification.localNotification({
      id: this.generateNotificationId(),
      title,
      message,
      channelId,
      userInfo: data
    });
  }
  
  async scheduleWeeklyProgressReminder(): Promise<void> {
    const nextMonday = this.getNextMonday();
    nextMonday.setHours(9, 0, 0, 0); // 9 AM every Monday
    
    PushNotification.localNotificationSchedule({
      id: this.generateNotificationId(),
      title: 'Weekly Progress Update',
      message: 'Check out your interview practice progress from last week!',
      date: nextMonday,
      channelId: 'practice-reminders',
      userInfo: {
        type: 'weekly_progress'
      },
      repeatType: 'week'
    });
  }
  
  async scheduleDailyChallengeNotification(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM daily
    
    PushNotification.localNotificationSchedule({
      id: this.generateNotificationId(),
      title: 'Daily Challenge Available',
      message: 'A new interview challenge is waiting for you!',
      date: tomorrow,
      channelId: 'practice-reminders',
      userInfo: {
        type: 'daily_challenge'
      },
      repeatType: 'day'
    });
  }
  
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    
    // Cancel existing notifications if disabled
    if (!preferences.practiceReminders) {
      this.cancelNotificationsByType('practice_reminder');
    }
    
    if (!preferences.dailyChallenges) {
      this.cancelNotificationsByType('daily_challenge');
    }
    
    if (!preferences.weeklyProgress) {
      this.cancelNotificationsByType('weekly_progress');
    }
    
    // Reschedule if enabled
    if (preferences.practiceReminders) {
      await this.scheduleDefaultReminders();
    }
    
    if (preferences.dailyChallenges) {
      await this.scheduleDailyChallengeNotification();
    }
    
    if (preferences.weeklyProgress) {
      await this.scheduleWeeklyProgressReminder();
    }
  }
  
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const preferences = await AsyncStorage.getItem('notificationPreferences');
      if (preferences) {
        return JSON.parse(preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    
    // Default preferences
    return {
      practiceReminders: true,
      expertSessionReminders: true,
      communityUpdates: true,
      achievementNotifications: true,
      dailyChallenges: true,
      weeklyProgress: true
    };
  }
  
  private async scheduleDefaultReminders(): Promise<void> {
    const preferences = await this.getNotificationPreferences();
    
    if (preferences.practiceReminders) {
      // Schedule daily practice reminder for 7 PM
      const reminderTime = new Date();
      reminderTime.setHours(19, 0, 0, 0);
      
      if (reminderTime <= new Date()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      await this.schedulePracticeReminder(reminderTime);
    }
  }
  
  private cancelNotificationsByType(type: string): void {
    // Note: React Native Push Notification doesn't provide a direct way to cancel by type
    // This would need to be tracked separately or use scheduled notification IDs
    PushNotification.cancelAllLocalNotifications();
    
    // Reschedule non-cancelled notifications
    this.rescheduleActiveNotifications(type);
  }
  
  private async rescheduleActiveNotifications(excludeType: string): Promise<void> {
    // Implementation would depend on how you track scheduled notifications
    // For now, reschedule default notifications
    await this.scheduleDefaultReminders();
  }
  
  private generateNotificationId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  private getNextMonday(): Date {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff + 7)); // Next Monday
  }
  
  // Public methods for external use
  getFCMToken(): string | null {
    return this.fcmToken;
  }
  
  async testNotification(): Promise<void> {
    this.showLocalNotification({
      title: 'Test Notification',
      message: 'This is a test notification from Salamin',
      data: { type: 'test' }
    });
  }
}
```

---

## Testing Strategy

### Phase 4 Testing Framework
```typescript
// Enterprise platform testing
describe('Enterprise Platform', () => {
  it('should handle complete enterprise onboarding', async () => {
    const enterpriseData = {
      companyInfo: {
        name: 'Test Corp',
        domain: 'testcorp.com',
        industry: 'technology',
        size: 'medium'
      }
    };
    
    const enterpriseId = await enterpriseService.createEnterpriseAccount(enterpriseData, 'admin@testcorp.com');
    expect(enterpriseId).toBeDefined();
    
    // Test user invitation flow
    const invitations = [
      { email: 'user1@testcorp.com', department: 'Engineering', role: 'Developer' },
      { email: 'user2@testcorp.com', department: 'Product', role: 'Manager' }
    ];
    
    const results = await enterpriseService.inviteUsers(enterpriseId, invitations, 'admin@testcorp.com');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.status === 'sent')).toBe(true);
  });
  
  it('should generate accurate analytics reports', async () => {
    const report = await enterpriseService.generateAnalyticsReport('test-enterprise', 'user_engagement', {
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      endDate: Timestamp.fromDate(new Date('2024-01-31'))
    });
    
    expect(report.data.summary).toBeDefined();
    expect(report.data.summary.totalUsers).toBeGreaterThan(0);
    expect(report.data.summary.engagementRate).toBeGreaterThanOrEqual(0);
    expect(report.charts).toHaveLength(3);
  });
});

// Mobile app testing
describe('Mobile Application', () => {
  it('should handle offline session storage', async () => {
    const offlineService = OfflineService.getInstance();
    
    const mockSession = {
      id: 'test-session',
      userId: 'test-user',
      questions: ['Question 1', 'Question 2'],
      responses: ['Response 1', 'Response 2'],
      completed: true
    };
    
    await offlineService.saveSessionOffline(mockSession);
    
    const offlineSessions = await offlineService.getOfflineSessions();
    expect(offlineSessions).toContainEqual(mockSession);
    expect(offlineService.getSyncQueueLength()).toBe(1);
  });
  
  it('should sync offline data when online', async () => {
    const offlineService = OfflineService.getInstance();
    
    // Mock network going online
    jest.spyOn(offlineService, 'isOnlineMode').mockReturnValue(true);
    
    await offlineService.forcSync();
    
    expect(offlineService.getSyncQueueLength()).toBe(0);
  });
});

// Notification testing
describe('Notification Service', () => {
  it('should schedule practice reminders', async () => {
    const notificationService = NotificationService.getInstance();
    
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 1);
    
    const notificationId = await notificationService.schedulePracticeReminder(reminderTime);
    expect(notificationId).toBeDefined();
  });
  
  it('should handle notification preferences', async () => {
    const notificationService = NotificationService.getInstance();
    
    const preferences = {
      practiceReminders: false,
      expertSessionReminders: true,
      communityUpdates: true,
      achievementNotifications: true,
      dailyChallenges: false,
      weeklyProgress: true
    };
    
    await notificationService.updateNotificationPreferences(preferences);
    
    const savedPreferences = await notificationService.getNotificationPreferences();
    expect(savedPreferences).toEqual(preferences);
  });
});
```

---

## Deployment Plan

### Week 13-14: Enterprise Platform Core
1. **Admin Dashboard Development**
   - Deploy enterprise management system
   - Launch user invitation and management
   - Test SSO integration framework

2. **Analytics System**
   - Deploy reporting and analytics engine
   - Launch dashboard customization
   - Test data export functionality

### Week 15: Mobile App Foundation
1. **React Native App Development**
   - Deploy core mobile application
   - Launch offline capabilities
   - Test cross-platform functionality

2. **Notification System**
   - Deploy push notification service
   - Launch reminder and engagement system
   - Test notification preferences

### Week 16: Integration & Launch
1. **Enterprise Features**
   - Launch enterprise billing system
   - Deploy API integration framework
   - Test white-label customization

2. **Mobile App Store Deployment**
   - Submit to iOS App Store
   - Submit to Google Play Store
   - Launch mobile marketing campaign

### Success Metrics
- **Enterprise Customers**: 5+ enterprise clients by week 16
- **Mobile Downloads**: 100,000+ app downloads within first month
- **Enterprise Revenue**: $500,000+ ARR from enterprise clients
- **Platform Completion**: 95%+ feature parity across web and mobile

---

## Success Metrics & KPIs

### Enterprise Platform Metrics
- **Enterprise Acquisition**: 5+ enterprise clients with $100,000+ annual contracts
- **User Seat Utilization**: 70%+ average seat utilization across enterprise accounts
- **Enterprise Retention**: 95%+ enterprise customer retention rate
- **Revenue per Enterprise**: $100,000+ average annual contract value

### Mobile Platform Metrics
- **App Downloads**: 100,000+ downloads within first 3 months
- **Mobile Daily Active Users**: 70%+ daily active usage rate
- **Offline Usage**: 40%+ of sessions completed offline
- **Mobile Conversion**: 25%+ mobile users upgrading to premium

### Revenue & Business Metrics
- **Total ARR**: $2,000,000+ annual recurring revenue
- **Enterprise ARR**: $500,000+ from enterprise subscriptions
- **Mobile Revenue**: $300,000+ from mobile subscriptions and in-app purchases
- **Platform Revenue Mix**: 60% individual, 25% enterprise, 15% expert marketplace

### Technical Performance
- **Platform Uptime**: 99.9%+ across all platforms
- **Mobile App Performance**: <3 second app launch time
- **Enterprise Dashboard Load**: <2 second dashboard load time
- **Cross-platform Sync**: 99%+ successful sync rate between web and mobile

This comprehensive Phase 4 plan completes the Salamin platform transformation, establishing it as a full-featured, enterprise-ready interview preparation ecosystem with comprehensive mobile accessibility and sustainable high-revenue business model.