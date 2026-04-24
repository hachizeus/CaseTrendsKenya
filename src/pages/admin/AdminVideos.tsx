import AdminVideoManager from './AdminVideoManager';

const AdminVideos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage YouTube videos that appear in the carousel section between "iPhone Model (Protectors)" and "Audio" sections
        </p>
      </div>
      <AdminVideoManager />
    </div>
  );
};

export default AdminVideos;