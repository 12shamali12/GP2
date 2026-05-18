import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Pill,
  Image as ImageIcon,
  AlertCircle,
  Filter,
  Search,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: number;
  patientName: string;
  patientInitials: string;
  requestType: 'treatment' | 'prescription' | 'records' | 'imaging';
  title: string;
  description: string;
  date: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  details?: string;
}

const approvalRequests: ApprovalRequest[] = [
  {
    id: 1,
    patientName: 'John Walker',
    patientInitials: 'JW',
    requestType: 'treatment',
    title: 'Root Canal Treatment Plan',
    description: 'Approval needed for comprehensive root canal treatment on tooth #14',
    date: '2 hours ago',
    urgency: 'high',
    status: 'pending',
    details: 'Patient has been experiencing severe pain. X-rays show infection requiring immediate root canal therapy.',
  },
  {
    id: 2,
    patientName: 'Maria Garcia',
    patientInitials: 'MG',
    requestType: 'prescription',
    title: 'Antibiotic Prescription',
    description: 'Request for amoxicillin 500mg prescription renewal',
    date: '5 hours ago',
    urgency: 'medium',
    status: 'pending',
    details: 'Patient completing current prescription, needs renewal for continued treatment of dental infection.',
  },
  {
    id: 3,
    patientName: 'Robert Brown',
    patientInitials: 'RB',
    requestType: 'records',
    title: 'Medical Records Transfer',
    description: 'Patient requesting transfer of dental records to new provider',
    date: '1 day ago',
    urgency: 'low',
    status: 'pending',
    details: 'Patient relocating, needs full dental history and recent treatment records.',
  },
  {
    id: 4,
    patientName: 'Sarah Lee',
    patientInitials: 'SL',
    requestType: 'imaging',
    title: 'Panoramic X-Ray Request',
    description: 'Authorization for full mouth panoramic imaging',
    date: '3 hours ago',
    urgency: 'medium',
    status: 'pending',
    details: 'Comprehensive imaging needed for orthodontic treatment planning.',
  },
  {
    id: 5,
    patientName: 'David Thompson',
    patientInitials: 'DT',
    requestType: 'treatment',
    title: 'Crown Placement Approval',
    description: 'Approval for ceramic crown on tooth #3',
    date: '2 days ago',
    urgency: 'low',
    status: 'approved',
    details: 'Crown preparation completed. Patient approved for permanent restoration.',
  },
  {
    id: 6,
    patientName: 'Emily Chen',
    patientInitials: 'EC',
    requestType: 'prescription',
    title: 'Pain Management Prescription',
    description: 'Post-operative pain medication request',
    date: '3 days ago',
    urgency: 'high',
    status: 'rejected',
    details: 'Alternative pain management recommended due to patient medication allergies.',
  },
];

const getRequestIcon = (type: ApprovalRequest['requestType']) => {
  switch (type) {
    case 'treatment':
      return FileText;
    case 'prescription':
      return Pill;
    case 'records':
      return FileText;
    case 'imaging':
      return ImageIcon;
  }
};

const getUrgencyColor = (urgency: ApprovalRequest['urgency']) => {
  switch (urgency) {
    case 'high':
      return 'bg-destructive-light text-destructive';
    case 'medium':
      return 'bg-warning-light text-warning';
    case 'low':
      return 'bg-accent-light text-accent';
  }
};

export default function DoctorApprovals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [requests, setRequests] = useState(approvalRequests);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const filteredRequests = (status: 'pending' | 'approved' | 'rejected') => {
    const list = requests.filter((r) => r.status === status);
    return list.filter(
      (r) =>
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleAction = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowDialog(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, status: actionType === 'approve' ? 'approved' : 'rejected' }
          : r
      )
    );

    toast.success(
      `Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`
    );

    setShowDialog(false);
    setNotes('');
    setSelectedRequest(null);
  };

  const RequestCard = ({ request }: { request: ApprovalRequest }) => {
    const Icon = getRequestIcon(request.requestType);

    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {request.patientInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {request.patientName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {request.date}
                  </p>
                </div>
                <Badge className={getUrgencyColor(request.urgency)} variant="outline">
                  {request.urgency} priority
                </Badge>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground mb-1">{request.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                </div>
              </div>

              {request.details && (
                <div className="p-3 rounded-lg bg-secondary mb-4">
                  <p className="text-sm text-muted-foreground">{request.details}</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-accent hover:bg-accent/90"
                    onClick={() => handleAction(request, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAction(request, 'reject')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {request.status === 'approved' && (
                <Badge className="bg-accent text-accent-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              )}

              {request.status === 'rejected' && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Approval Requests
        </h1>
        <p className="text-muted-foreground">
          Review and manage patient approval requests
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            label: 'Pending',
            value: pendingRequests.length,
            icon: Clock,
            color: 'text-warning',
            bgColor: 'bg-warning-light',
          },
          {
            label: 'Approved',
            value: approvedRequests.length,
            icon: CheckCircle,
            color: 'text-accent',
            bgColor: 'bg-accent-light',
          },
          {
            label: 'Rejected',
            value: rejectedRequests.length,
            icon: XCircle,
            color: 'text-destructive',
            bgColor: 'bg-destructive-light',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or request type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button variant="outline" className="h-12">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-grid">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {filteredRequests('pending').length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-light flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  All caught up!
                </h3>
                <p className="text-muted-foreground">
                  No pending approval requests at the moment
                </p>
              </Card>
            ) : (
              filteredRequests('pending').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {filteredRequests('approved').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {filteredRequests('rejected').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {actionType === 'approve'
                    ? 'Are you sure you want to approve this request for '
                    : 'Are you sure you want to reject this request for '}
                  <strong>{selectedRequest.patientName}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 rounded-lg bg-secondary">
                <p className="font-medium text-foreground mb-1">
                  {selectedRequest.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={
                actionType === 'approve'
                  ? 'bg-accent hover:bg-accent/90'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
